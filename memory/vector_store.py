# -*- coding: utf-8 -*-
"""
🔮 VECTOR STORE — Memoria Semántica ANTIGRAVITY
=================================================
Almacena y recupera conversaciones usando embeddings vectoriales.
Usa HuggingFace Inference API para embeddings + Supabase pgvector.
Fallback a similitud por hash si no hay DB disponible.
"""

import os
import json
import hashlib
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("c8l.vector_store")

HF_TOKEN = os.environ.get("HUGGINGFACE_TOKEN", "")
HF_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
HF_EMBED_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{HF_EMBED_MODEL}"

# Local fallback
LOCAL_MEMORY_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "vector_memory"
)
os.makedirs(LOCAL_MEMORY_DIR, exist_ok=True)



class VectorStore:
    """
    Almacena y recupera memorias usando similitud semántica.
    - Guarda cada interacción con su embedding
    - Recupera las N más relevantes para un query dado
    """

    def __init__(self):
        self._local_store: Dict[str, List[Dict]] = {}

    async def store(self, user_id: str, text: str, response: str,
                    intent: str = "", metadata: Dict = None) -> str:
        """Almacena una interacción con su embedding."""
        entry_id = f"{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        embedding = await self._get_embedding(text)

        entry = {
            "id": entry_id,
            "user_id": user_id,
            "text": text,
            "response": response,
            "intent": intent,
            "embedding": embedding,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat(),
        }

        # Guardar localmente
        if user_id not in self._local_store:
            self._local_store[user_id] = []
        self._local_store[user_id].append(entry)

        # Limitar a 200 entries por usuario
        if len(self._local_store[user_id]) > 200:
            self._local_store[user_id] = self._local_store[user_id][-200:]

        # Persistir
        self._save_local(user_id)
        return entry_id


    async def retrieve(self, user_id: str, query: str, limit: int = 5) -> List[Dict]:
        """Recupera las interacciones más similares al query."""
        query_embedding = await self._get_embedding(query)

        entries = self._local_store.get(user_id, [])
        if not entries:
            entries = self._load_local(user_id)
            self._local_store[user_id] = entries

        # Calcular similitud
        scored = []
        for entry in entries:
            sim = self._cosine_similarity(query_embedding, entry.get("embedding", []))
            scored.append((sim, entry))

        # Ordenar por similitud descendente
        scored.sort(key=lambda x: x[0], reverse=True)

        return [
            {**entry, "_similarity": score}
            for score, entry in scored[:limit]
        ]

    async def _get_embedding(self, text: str) -> List[float]:
        """Genera embedding usando HuggingFace Inference API."""
        if not HF_TOKEN:
            return self._hash_embedding(text)

        try:
            import aiohttp
            headers = {"Authorization": f"Bearer {HF_TOKEN}"}
            payload = {"inputs": text[:512]}

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    HF_EMBED_URL, headers=headers, json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if isinstance(data, list) and len(data) > 0:
                            if isinstance(data[0], list):
                                return data[0]
                            return data
        except Exception as e:
            logger.warning(f"HF Embedding fallback: {e}")

        return self._hash_embedding(text)

    def _hash_embedding(self, text: str) -> List[float]:
        """Fallback: genera pseudo-embedding con hash."""
        h = hashlib.sha256(text.encode()).digest()
        return [float(b) / 255.0 for b in h[:64]]


    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calcula similitud coseno entre dos vectores."""
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(y * y for y in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _save_local(self, user_id: str):
        """Guarda memorias en JSON local."""
        filepath = os.path.join(LOCAL_MEMORY_DIR, f"{user_id}.json")
        entries = self._local_store.get(user_id, [])
        # No guardar embeddings en disco (muy grandes)
        to_save = []
        for e in entries[-100:]:
            entry_copy = {k: v for k, v in e.items() if k != "embedding"}
            to_save.append(entry_copy)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(to_save, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando memoria local: {e}")

    def _load_local(self, user_id: str) -> List[Dict]:
        """Carga memorias de JSON local."""
        filepath = os.path.join(LOCAL_MEMORY_DIR, f"{user_id}.json")
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    entries = json.load(f)
                # Regenerar embeddings hash para las cargadas
                for e in entries:
                    if "embedding" not in e:
                        e["embedding"] = self._hash_embedding(e.get("text", ""))
                return entries
            except:
                pass
        return []
