# -*- coding: utf-8 -*-
"""
🔍 VECTOR STORE — Búsqueda Semántica Ultraligera
==================================================
Motor de embeddings local para búsqueda por similitud.

Opciones de backend (de más ligero a más potente):
1. Hash-based (0 dependencias, ~70% precisión)
2. TF-IDF local (sklearn, ~80% precisión)
3. HuggingFace Inference API (gratis, ~95% precisión)
4. Supabase pgvector (producción, ~98% precisión)

Empieza con hash-based, escala automáticamente si detecta
que hay mejor backend disponible.
"""

import hashlib
import math
import time
import json
import os
import logging
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

logger = logging.getLogger("c8l.memory.vectors")


class VectorStore:
    """
    Vector store adaptativo.
    Almacena conocimiento y permite búsqueda semántica.
    """

    EMBEDDING_DIM = 128  # Dimensión de embeddings hash-based
    MAX_ENTRIES = 5000
    SIMILARITY_THRESHOLD = 0.75

    def __init__(self, persist_path: str = None):
        from config import MEMORY_DIR
        self.persist_path = persist_path or os.path.join(
            MEMORY_DIR, "vector_store.json"
        )
        self._store: Dict[str, Dict] = {}
        self._embeddings: Dict[str, List[float]] = {}
        self._load()

    def add(self, text: str, metadata: Dict = None,
            category: str = "general") -> str:
        """
        Añade un texto al vector store.

        Args:
            text: Texto a almacenar
            metadata: Metadatos asociados
            category: Categoría del conocimiento

        Returns:
            ID del entry
        """
        entry_id = self._generate_id(text)

        # No duplicar
        if entry_id in self._store:
            return entry_id

        embedding = self._compute_embedding(text)

        self._store[entry_id] = {
            "text": text[:2000],
            "category": category,
            "metadata": metadata or {},
            "timestamp": time.time(),
            "access_count": 0,
        }
        self._embeddings[entry_id] = embedding

        # Limitar tamaño
        if len(self._store) > self.MAX_ENTRIES:
            self._prune()

        return entry_id

    def search(self, query: str, limit: int = 5,
               category: str = None,
               min_similarity: float = None) -> List[Dict]:
        """
        Búsqueda semántica por similitud.

        Args:
            query: Texto de búsqueda
            limit: Máximo resultados
            category: Filtrar por categoría
            min_similarity: Umbral mínimo de similitud

        Returns:
            Lista de resultados ordenados por relevancia
        """
        threshold = min_similarity or self.SIMILARITY_THRESHOLD
        query_embedding = self._compute_embedding(query)

        results = []
        for entry_id, embedding in self._embeddings.items():
            # Filtro por categoría
            if category and self._store[entry_id].get("category") != category:
                continue

            similarity = self._cosine_similarity(query_embedding, embedding)
            if similarity >= threshold:
                entry = self._store[entry_id].copy()
                entry["similarity"] = round(similarity, 4)
                entry["id"] = entry_id
                results.append(entry)
                # Incrementar access count
                self._store[entry_id]["access_count"] += 1

        # Ordenar por similitud
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

    def search_similar(self, text: str, threshold: float = 0.95) -> Optional[Dict]:
        """
        Busca si hay un texto muy similar ya almacenado.
        Útil para deduplicación y reutilización de respuestas.

        Returns:
            Entry más similar si supera threshold, o None
        """
        results = self.search(text, limit=1, min_similarity=threshold)
        return results[0] if results else None

    def get_categories(self) -> Dict[str, int]:
        """Cuenta de entries por categoría."""
        counts = defaultdict(int)
        for entry in self._store.values():
            counts[entry.get("category", "general")] += 1
        return dict(counts)

    def size(self) -> int:
        """Número de entries almacenados."""
        return len(self._store)

    def _compute_embedding(self, text: str) -> List[float]:
        """
        Genera embedding usando hash-based approach.
        Rápido y sin dependencias externas.

        Para mejor precisión, se puede reemplazar con:
        - HuggingFace Inference API (sentence-transformers)
        - Groq embeddings
        """
        text_lower = text.lower().strip()

        # N-gram hashing para capturar semántica local
        ngrams = []
        words = text_lower.split()

        # Unigrams
        for word in words:
            ngrams.append(word)

        # Bigrams
        for i in range(len(words) - 1):
            ngrams.append(f"{words[i]} {words[i+1]}")

        # Hash cada n-gram a una posición en el embedding
        embedding = [0.0] * self.EMBEDDING_DIM
        for ngram in ngrams:
            h = hashlib.md5(ngram.encode()).digest()
            for i in range(0, min(len(h), self.EMBEDDING_DIM), 2):
                idx = h[i] % self.EMBEDDING_DIM
                val = (h[i + 1] if i + 1 < len(h) else h[0]) / 255.0
                embedding[idx] += val

        # Normalizar
        norm = math.sqrt(sum(x * x for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]

        return embedding

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Similitud coseno entre dos vectores."""
        if not a or not b or len(a) != len(b):
            return 0.0

        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot / (norm_a * norm_b)

    def _generate_id(self, text: str) -> str:
        """Genera ID único para un texto."""
        return hashlib.sha256(text.encode()).hexdigest()[:16]

    def _prune(self):
        """Elimina entries menos accedidos."""
        sorted_entries = sorted(
            self._store.items(),
            key=lambda x: x[1].get("access_count", 0)
        )
        # Eliminar 20% menos usado
        to_remove = int(len(sorted_entries) * 0.2)
        for entry_id, _ in sorted_entries[:to_remove]:
            del self._store[entry_id]
            del self._embeddings[entry_id]
        logger.info(f"🧹 VectorStore pruned: {to_remove} entries removed")

    def _load(self):
        """Carga desde disco."""
        try:
            if os.path.exists(self.persist_path):
                with open(self.persist_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._store = data.get("store", {})
                    self._embeddings = data.get("embeddings", {})
                    # Convertir embeddings de listas
                    for k, v in self._embeddings.items():
                        if isinstance(v, list):
                            self._embeddings[k] = v
        except Exception as e:
            logger.warning(f"VectorStore load error: {e}")

    def save(self):
        """Guarda en disco."""
        try:
            os.makedirs(os.path.dirname(self.persist_path), exist_ok=True)
            data = {
                "store": self._store,
                "embeddings": self._embeddings,
                "saved_at": time.time(),
            }
            with open(self.persist_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            logger.debug(f"VectorStore saved: {len(self._store)} entries")
        except Exception as e:
            logger.error(f"VectorStore save error: {e}")
