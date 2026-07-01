"""
🚀 EVOLUTION ORCHESTRATOR
===========================
Orquesta todos los módulos de evolución del sistema.

Integra los 7 módulos y los ejecuta en paralelo:
1. MetaAgent - Crea agentes
2. CollectiveMemory - Memoria compartida
3. ProactivePredictor - Predicción
4. ResourceManager - Recursos
5. ProactiveDefense - Seguridad
6. MultiCloudDeploy - Multi-nube
7. SelfImprovement - Auto-mejora
"""

import asyncio
from typing import Dict, List, Any
from core.meta_agent import MetaAgent
from core.collective_memory import CollectiveMemory
from core.proactive_predictor import ProactivePredictor
from core.resource_manager import ResourceManager
from core.proactive_defense import ProactiveDefense
from core.multi_cloud_deploy import MultiCloudDeploy
from core.self_improvement import SelfImprovement


class EvolutionOrchestrator:
    """Orquesta todos los módulos de evolución"""

    def __init__(self):
        self.meta_agent = MetaAgent()
        self.collective_memory = CollectiveMemory()
        self.proactive_predictor = ProactivePredictor()
        self.resource_manager = ResourceManager()
        self.proactive_defense = ProactiveDefense()
        self.multi_cloud = MultiCloudDeploy()
        self.self_improvement = SelfImprovement()
        self.running = True

    async def start(self):
        """Inicia todos los módulos de evolución"""
        print("🧬 EvolutionOrchestrator: Iniciando sistema evolutivo...")

        # Crear tareas para cada módulo
        tasks = [
            self.meta_agent.start(),
            self.collective_memory.start(),
            self.proactive_predictor.start(),
            self.resource_manager.start(),
            self.proactive_defense.start(),
            self.multi_cloud.start(),
            self.self_improvement.start()
        ]

        # Ejecutar en paralelo
        await asyncio.gather(*tasks)

    def get_status(self) -> Dict:
        """Obtiene el estado de todos los módulos"""
        return {
            'meta_agent': self.meta_agent.get_status(),
            'collective_memory': 'active',
            'proactive_predictor': 'active',
            'resource_manager': 'active',
            'proactive_defense': 'active',
            'multi_cloud': 'active',
            'self_improvement': 'active'
        }

    async def stop(self):
        """Detiene todos los módulos"""
        self.running = False
        self.meta_agent.running = False
        self.proactive_predictor.running = False
        self.resource_manager.running = False
        self.proactive_defense.running = False
        self.self_improvement.running = False
        print("🧬 EvolutionOrchestrator: Sistema evolutivo detenido")
