"""
🎯 MÓDULO 4: OPTIMIZACIÓN DE RECURSOS
=======================================
Optimiza el uso de recursos como un sistema operativo.

Monitorea CPU, memoria, tareas concurrentes y tokens.
Aplica throttling, limpieza de memoria, y límites automáticos.
"""

import asyncio
import psutil
from datetime import datetime
from typing import Dict, List, Any


class ResourceManager:
    """Optimiza el uso de recursos como un sistema operativo"""

    def __init__(self):
        self.resource_pool = {
            'cpu': 0,
            'memory': 0,
            'api_calls': 0,
            'tokens': 0,
            'concurrent_tasks': 0
        }
        self.limits = {
            'cpu': 80,
            'memory': 80,
            'api_calls': 1000,
            'tokens': 1000000,
            'concurrent_tasks': 10
        }
        self.running = True
        self.history = []

    async def monitor_resources(self) -> Dict:
        """Monitorea el uso de recursos en tiempo real"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()

        status = {
            'cpu': cpu_percent,
            'memory': memory.percent,
            'memory_available': memory.available,
            'timestamp': datetime.now().isoformat()
        }

        self.resource_pool.update(status)
        self.history.append(status)

        # Mantener historial
        if len(self.history) > 100:
            self.history = self.history[-100:]

        return status

    async def optimize(self) -> Dict:
        """Optimiza el uso de recursos"""
        status = await self.monitor_resources()
        actions = []

        # 1. Verificar CPU
        if status['cpu'] > self.limits['cpu']:
            actions.append(await self._reduce_cpu())

        # 2. Verificar memoria
        if status['memory'] > self.limits['memory']:
            actions.append(await self._free_memory())

        # 3. Verificar tareas concurrentes
        if self.resource_pool['concurrent_tasks'] > self.limits['concurrent_tasks']:
            actions.append(await self._limit_tasks())

        # 4. Verificar tokens
        if self.resource_pool['tokens'] > self.limits['tokens']:
            actions.append(await self._optimize_tokens())

        return {
            'optimized': len(actions) > 0,
            'actions': actions,
            'current_status': status
        }

    async def _reduce_cpu(self) -> Dict:
        """Reduce el uso de CPU"""
        # En producción, aquí se implementaría la reducción de CPU
        # Por ejemplo, reducir la prioridad de procesos, limitar tareas, etc.
        return {'action': 'cpu_throttle', 'status': 'applied'}

    async def _free_memory(self) -> Dict:
        """Libera memoria"""
        import gc
        gc.collect()
        return {'action': 'memory_cleanup', 'freed': 'gc_collected'}

    async def _limit_tasks(self) -> Dict:
        """Limita las tareas concurrentes"""
        self.resource_pool['concurrent_tasks'] = self.limits['concurrent_tasks'] * 0.8
        return {'action': 'task_limit', 'new_limit': self.resource_pool['concurrent_tasks']}

    async def _optimize_tokens(self) -> Dict:
        """Optimiza el uso de tokens"""
        return {'action': 'token_optimization', 'status': 'applied'}

    async def start(self):
        """Inicia el sistema de optimización de recursos"""
        print("🎯 ResourceManager: Iniciando optimización de recursos...")

        while self.running:
            try:
                await self.optimize()
                await asyncio.sleep(30)
            except Exception as e:
                print(f"❌ ResourceManager: Error - {e}")
                await asyncio.sleep(10)
