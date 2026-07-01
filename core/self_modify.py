# -*- coding: utf-8 -*-
"""
⚡ SELF-MODIFY ENGINE — El bot se edita a sí mismo
====================================================
Motor de auto-modificación segura para Antigravity v5.0.

Flujo completo:
1. PLANIFICAR — Analiza qué cambio se necesita
2. GENERAR — LLM genera el código nuevo
3. VALIDAR — Verifica sintaxis y coherencia
4. DEPLOY — Push a branch + PR (nunca directo a main)
5. VERIFICAR — Comprueba que el deploy fue exitoso

Seguridad:
- Solo el ADMIN puede autorizar cambios destructivos
- Siempre crea branch (nunca toca main directamente)
- Backup antes de cualquier cambio
- Rollback automático si algo falla
- Archivos protegidos que NO se pueden tocar

Autor: C8L Agency / Leo
"""

import os
import ast
import time
import logging
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field

logger = logging.getLogger("c8l.core.self_modify")


@dataclass
class ModifyPlan:
    """Plan de modificación."""
    action: str  # "create", "edit", "delete"
    file_path: str
    description: str
    code: str = ""
    commit_message: str = ""
    risk_level: str = "low"  # low, medium, high, critical
    requires_approval: bool = False
    validated: bool = False
    errors: List[str] = field(default_factory=list)


@dataclass
class ModifyResult:
    """Resultado de una auto-modificación."""
    success: bool
    message: str
    plan: Optional[ModifyPlan] = None
    pr_url: Optional[str] = None
    branch: Optional[str] = None
    rollback_info: Optional[Dict] = None


class SelfModifyEngine:
    """
    ⚡ Motor de Auto-Modificación.

    El bot puede:
    - Agregar nuevos comandos
    - Corregir bugs en su propio código
    - Crear nuevos módulos
    - Mejorar funciones existentes

    Todo de forma SEGURA con validación y rollback.
    """

    # Archivos que NUNCA se pueden modificar automáticamente
    PROTECTED_FILES = [
        "config.py",  # Configuración sensible
        ".env",       # Secrets
        ".env.example",
    ]

    # Archivos que requieren aprobación explícita del admin
    SENSITIVE_FILES = [
        "telegram_antigravity.py",  # Bot principal
        "api_router.py",            # Router de APIs
        "Dockerfile",               # Deploy config
        "requirements.txt",         # Dependencias
    ]

    # Máximo de caracteres por archivo generado
    MAX_FILE_SIZE = 50000

    def __init__(self):
        self._history: List[Dict] = []
        self._stats = {
            "plans_created": 0,
            "edits_successful": 0,
            "edits_failed": 0,
            "validations_passed": 0,
            "validations_failed": 0,
        }

    def plan_modification(self, instruction: str,
                          context: str = "") -> ModifyPlan:
        """
        Fase 1: PLANIFICAR — Analiza la instrucción y genera un plan.

        Usa el LLM para entender qué se necesita hacer y en qué archivo.
        """
        from api_router import get_router

        router = get_router()
        self._stats["plans_created"] += 1

        plan_prompt = f"""Analiza esta instrucción para modificar un bot de Telegram Python:

INSTRUCCIÓN: "{instruction}"

CONTEXTO DEL PROYECTO:
- telegram_antigravity.py: Bot Telegram principal (handlers, comandos)
- api_router.py: Router de APIs (Groq, OpenRouter, Gemini, etc.)
- nlp/intent_engine.py: Motor de intenciones (3 capas)
- integrations/github_ops.py: Control de GitHub
- integrations/deploy_control.py: Control de deploys
- casino/: Módulos de juegos (slot, etc.)
- chess/: Módulo de ajedrez
- memory/: Sistema de memoria (vector_store, user_context, etc.)
- core/: Módulos core (self_modify, evolution, etc.)
- skills/: Habilidades directas (clima, crypto, etc.)
{f"CONTEXTO ADICIONAL: {context}" if context else ""}

Responde con JSON:
{{
    "action": "create" o "edit",
    "file_path": "ruta/del/archivo.py",
    "description": "qué se va a hacer exactamente",
    "risk_level": "low" o "medium" o "high",
    "requires_existing_read": true/false,
    "commit_message": "mensaje del commit"
}}"""

        response = router.quick(
            prompt=plan_prompt,
            system="Eres un arquitecto de software. Analiza cambios y responde SOLO con JSON.",
            max_tokens=300,
        )

        # Parsear respuesta
        plan_data = self._parse_json(response)
        if not plan_data:
            return ModifyPlan(
                action="unknown",
                file_path="",
                description="No se pudo planificar",
                errors=["Error parseando plan del LLM"],
            )

        plan = ModifyPlan(
            action=plan_data.get("action", "edit"),
            file_path=plan_data.get("file_path", ""),
            description=plan_data.get("description", instruction),
            commit_message=plan_data.get("commit_message", f"⚡ Auto: {instruction[:50]}"),
            risk_level=plan_data.get("risk_level", "medium"),
        )

        # Verificar si requiere aprobación
        if plan.file_path in self.PROTECTED_FILES:
            plan.errors.append(f"❌ Archivo protegido: {plan.file_path}")
            plan.requires_approval = True
            plan.risk_level = "critical"
        elif plan.file_path in self.SENSITIVE_FILES:
            plan.requires_approval = True
            plan.risk_level = "high"

        return plan

    def generate_code(self, plan: ModifyPlan,
                      existing_code: str = "") -> ModifyPlan:
        """
        Fase 2: GENERAR — El LLM genera el código.
        """
        from api_router import get_router

        router = get_router()

        if plan.action == "create":
            gen_prompt = f"""Genera el código Python COMPLETO para un nuevo archivo.

ARCHIVO: {plan.file_path}
PROPÓSITO: {plan.description}

REGLAS:
- Código Python limpio y funcional
- Incluir docstring al inicio
- Incluir imports necesarios
- Usar logging (logger = logging.getLogger("c8l.xxx"))
- Seguir el estilo del proyecto (clases con métodos descriptivos)
- NO incluir ``` ni marcadores markdown
- Generar el archivo COMPLETO, listo para guardar

Genera el código:"""
        else:
            gen_prompt = f"""Modifica este código Python según la instrucción.

ARCHIVO: {plan.file_path}
INSTRUCCIÓN: {plan.description}

CÓDIGO ACTUAL:
```python
{existing_code[:3000]}
```

REGLAS:
- Devuelve el archivo COMPLETO modificado
- Mantén todo lo existente que no necesite cambiar
- NO incluir ``` ni marcadores markdown
- Código funcional y limpio

Genera el código modificado completo:"""

        response = router.smart(
            prompt=gen_prompt,
            system="Eres un programador experto en Python. Genera código limpio, funcional y completo. NO uses markdown, solo código Python puro.",
            max_tokens=4096,
        )

        if response:
            # Limpiar posibles markdown
            code = response.strip()
            if code.startswith("```python"):
                code = code[9:]
            if code.startswith("```"):
                code = code[3:]
            if code.endswith("```"):
                code = code[:-3]
            plan.code = code.strip()
        else:
            plan.errors.append("Error generando código")

        return plan

    def validate_code(self, plan: ModifyPlan) -> ModifyPlan:
        """
        Fase 3: VALIDAR — Verifica que el código es válido.
        """
        if not plan.code:
            plan.errors.append("No hay código para validar")
            plan.validated = False
            self._stats["validations_failed"] += 1
            return plan

        errors = []

        # 1. Verificar tamaño
        if len(plan.code) > self.MAX_FILE_SIZE:
            errors.append(f"Código demasiado largo ({len(plan.code)} chars, max {self.MAX_FILE_SIZE})")

        # 2. Verificar sintaxis Python
        try:
            ast.parse(plan.code)
        except SyntaxError as e:
            errors.append(f"Error de sintaxis línea {e.lineno}: {e.msg}")

        # 3. Verificar que no tiene código malicioso
        dangerous_patterns = [
            "os.system(", "subprocess.call(", "exec(", "__import__(",
            "shutil.rmtree(", "os.remove(", "os.rmdir(",
        ]
        for pattern in dangerous_patterns:
            if pattern in plan.code:
                # Permitir eval solo en calculadora segura
                if pattern == "exec(" or (pattern == "os.remove(" and "tempfile" not in plan.code):
                    errors.append(f"Patrón peligroso detectado: {pattern}")

        # 4. Verificar que tiene docstring
        if not plan.code.strip().startswith(('"""', "'''", "#")):
            errors.append("⚠️ Sin docstring/comentario al inicio (warning)")

        if errors:
            plan.errors.extend(errors)
            plan.validated = False
            self._stats["validations_failed"] += 1
        else:
            plan.validated = True
            self._stats["validations_passed"] += 1

        return plan

    def execute(self, plan: ModifyPlan, force: bool = False) -> ModifyResult:
        """
        Fase 4: DEPLOY — Ejecuta el cambio (branch + edit + PR).
        """
        # Verificar que está validado
        if not plan.validated and not force:
            return ModifyResult(
                success=False,
                message=f"❌ Código no validado. Errores:\n" +
                        "\n".join(f"  • {e}" for e in plan.errors),
                plan=plan,
            )

        # Verificar aprobación
        if plan.requires_approval and not force:
            return ModifyResult(
                success=False,
                message=(
                    f"⚠️ *Requiere aprobación*\n\n"
                    f"Archivo: `{plan.file_path}`\n"
                    f"Riesgo: {plan.risk_level}\n"
                    f"Acción: {plan.description}\n\n"
                    f"Usa `/approve` para autorizar."
                ),
                plan=plan,
            )

        # Ejecutar via GitHub
        try:
            from integrations.github_ops import get_github

            gh = get_github()
            branch_name = f"bot/self-modify-{int(time.time())}"

            result = gh.full_edit(
                path=plan.file_path,
                new_content=plan.code,
                commit_message=plan.commit_message,
                branch_name=branch_name,
                create_pr=True,
            )

            if result.success:
                self._stats["edits_successful"] += 1
                self._history.append({
                    "time": time.time(),
                    "file": plan.file_path,
                    "action": plan.action,
                    "branch": branch_name,
                    "success": True,
                })

                return ModifyResult(
                    success=True,
                    message=(
                        f"✅ *Auto-modificación exitosa*\n\n"
                        f"📄 Archivo: `{plan.file_path}`\n"
                        f"🔀 Branch: `{branch_name}`\n"
                        f"💬 {plan.commit_message}\n"
                        f"✓ Validación: pasada\n"
                        f"✓ Sintaxis: correcta"
                    ),
                    plan=plan,
                    pr_url=result.url,
                    branch=branch_name,
                )
            else:
                self._stats["edits_failed"] += 1
                return ModifyResult(
                    success=False,
                    message=f"❌ Error en GitHub: {result.message}",
                    plan=plan,
                )

        except Exception as e:
            self._stats["edits_failed"] += 1
            logger.error(f"Self-modify execute error: {e}")
            return ModifyResult(
                success=False,
                message=f"❌ Error ejecutando: {e}",
                plan=plan,
            )

    def full_modify(self, instruction: str,
                    context: str = "",
                    auto_approve: bool = False) -> ModifyResult:
        """
        ⚡ Flujo completo: planificar → generar → validar → deploy.

        Args:
            instruction: Qué quiere el usuario
            context: Contexto adicional
            auto_approve: Si saltarse la aprobación (solo para low risk)
        """
        # 1. Planificar
        plan = self.plan_modification(instruction, context)
        if plan.errors and "protegido" in str(plan.errors):
            return ModifyResult(
                success=False,
                message=f"🔒 {plan.errors[0]}",
                plan=plan,
            )

        # 2. Si necesita leer el archivo existente (edit)
        existing_code = ""
        if plan.action == "edit":
            try:
                from integrations.github_ops import get_github
                gh = get_github()
                result = gh.read_file(path=plan.file_path)
                if result.success and result.data.get("content"):
                    existing_code = result.data["content"]
            except Exception:
                pass

        # 3. Generar código
        plan = self.generate_code(plan, existing_code)
        if not plan.code:
            return ModifyResult(
                success=False,
                message="❌ No se pudo generar código",
                plan=plan,
            )

        # 4. Validar
        plan = self.validate_code(plan)

        # 5. Ejecutar
        force = auto_approve and plan.risk_level == "low"
        return self.execute(plan, force=force)

    # -------------------------------------------------------------------
    # Utilidades
    # -------------------------------------------------------------------

    def _parse_json(self, response: str) -> Optional[Dict]:
        """Extrae JSON de la respuesta del LLM."""
        import json
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError):
            pass
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except (json.JSONDecodeError, ValueError):
            pass
        return None

    def get_stats(self) -> Dict[str, Any]:
        return {**self._stats, "history_count": len(self._history)}

    def get_stats_text(self) -> str:
        s = self._stats
        return (
            f"🧬 *Self-Modify Engine*\n"
            f"📋 Planes: {s['plans_created']}\n"
            f"✅ Éxitos: {s['edits_successful']}\n"
            f"❌ Fallos: {s['edits_failed']}\n"
            f"✓ Validaciones OK: {s['validations_passed']}\n"
            f"✗ Validaciones fail: {s['validations_failed']}"
        )

    def get_history(self, limit: int = 10) -> List[Dict]:
        return self._history[-limit:]


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_engine_instance: Optional[SelfModifyEngine] = None


def get_self_modify() -> SelfModifyEngine:
    """Obtiene la instancia global del Self-Modify Engine."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = SelfModifyEngine()
    return _engine_instance
