"""
🌐 MÓDULO 2: MEMORIA COLECTIVA
================================
Memoria compartida entre todos los agentes del sistema.

Permite almacenar, recuperar y buscar conocimiento usando embeddings
y similitud coseno. Incluye grafo de conocimiento, detección de patrones,
y poda automática de memoria.
"""

import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict


class CollectiveMemory:
    """Memoria compartida entre todos los agentes del sistema"""

    def __init__(self):
        self.memory_store = {}
        self.knowledge_graph = defaultdict(list)
        self.embedding_cache = {}
        self.pattern_database = []
        self.running = True
        self.max_memory_entries = 10000
        self.learning_rate = 0.7

    async def store(self, data: Dict) -> str:
        """Almacena conocimiento en la memoria colectiva"""
        entry_id = f"mem_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(self.memory_store)}"

        self.memory_store[entry_id] = {
            'id': entry_id,
            'content': data.get('content', ''),
            'category': data.get('category', 'general'),
            'source': data.get('source', 'unknown'),
            'timestamp': datetime.now().isoformat(),
            'embedding': await self._generate_embedding(data.get('content', '')),
            'metadata': data.get('metadata', {}),
            'relevance_score': 1.0
        }

        # Actualizar grafo de conocimiento
        if data.get('category'):
            self.knowledge_graph[data['category']].append(entry_id)

        # Limitar tamaño de la memoria
        if len(self.memory_store) > self.max_memory_entries:
            self._prune_memory()

        return entry_id

    async def retrieve(self, query: str, limit: int = 5) -> List[Dict]:
        """Recupera conocimiento de la memoria colectiva"""
        query_embedding = await self._generate_embedding(query)

        results = []
        for entry_id, entry in self.memory_store.items():
            similarity = self._cosine_similarity(query_embedding, entry['embedding'])
            entry['_similarity'] = similarity
            results.append(entry)

        # Ordenar por relevancia
        sorted_results = sorted(results, key=lambda x: x.get('_similarity', 0), reverse=True)

        # Aplicar decay de relevancia
        for result in sorted_results[:limit]:
            result['relevance_score'] *= 0.98

        return sorted_results[:limit]

    async def store_pattern(self, pattern: Dict):
        """Almacena un patrón de comportamiento detectado"""
        self.pattern_database.append({
            'pattern': pattern,
            'frequency': 1,
            'last_seen': datetime.now().isoformat()
        })

    async def get_insights(self, query: str) -> Dict:
        """Obtiene insights basados en la memoria colectiva"""
        # 1. Buscar conocimiento relevante
        relevant = await self.retrieve(query, limit=10)

        # 2. Identificar patrones
        patterns = []
        for item in relevant:
            # Extraer patrones del contenido
            patterns.append({
                'source': item['id'],
                'category': item.get('category', 'unknown'),
                'insight': item['content'][:200]
            })

        return {
            'patterns': patterns,
            'relevance_count': len(relevant),
            'timestamp': datetime.now().isoformat()
        }

    async def _generate_embedding(self, text: str) -> List[float]:
        """Genera un embedding para el texto (simulado)"""
        # Simulación de embedding (en producción usar un modelo real)
        if text in self.embedding_cache:
            return self.embedding_cache[text]

        # Crear embedding simple basado en hash
        hash_bytes = hashlib.sha256(text.encode()).digest()
        embedding = [float(b) / 255.0 for b in hash_bytes[:128]]

        self.embedding_cache[text] = embedding
        return embedding

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calcula la similitud coseno entre dos vectores"""
        if not a or not b:
            return 0.0

        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(y * y for y in b) ** 0.5

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)

    def _prune_memory(self):
        """Reduce el tamaño de la memoria eliminando entradas menos relevantes"""
        sorted_entries = sorted(
            self.memory_store.values(),
            key=lambda x: x.get('relevance_score', 0)
        )

        # Eliminar el 20% menos relevante
        to_remove = int(len(sorted_entries) * 0.2)
        for entry in sorted_entries[:to_remove]:
            del self.memory_store[entry['id']]

    async def start(self):
        """Inicia el sistema de memoria colectiva"""
        print("🌐 CollectiveMemory: Iniciando memoria colectiva...")
        # Aquí se podrían cargar datos persistentes
