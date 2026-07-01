# -*- coding: utf-8 -*-
"""
⚡ POLYGON ARCHITECT — Arquitecto de videojuegos poligonales 3D/4D
====================================================================
Servant especializado en diseño espacial y creación de polígonos.
Fragmenta una petición de juego en sub-tareas pequeñas y reparte cada
una a un sirviente experto (modelo barato/gratis, en paralelo), luego
ensambla el resultado sobre el motor WebGL2 real de C8L
(engine_3d4d.html) en vez de generar un engine desde cero cada vez.

Flujo:
1. PLANIFICAR  — un modelo fuerte (Haiku via OpenRouter) decide qué
                  partes del motor tocar y qué sirviente hace cada una.
2. FRAGMENTAR  — cada sirviente (Groq, barato/gratis) genera SOLO su
                  función, en paralelo.
3. ENSAMBLAR   — se insertan las funciones nuevas/modificadas en una
                  copia del motor base.
4. VALIDAR     — chequeo de sintaxis JS (node --check si está disponible,
                  si no, balance de llaves) antes de entregar el archivo.

Autor: C8L Agency / Leo
"""

import os
import re
import time
import json
import logging
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any

logger = logging.getLogger("c8l.game_designer.polygon_architect")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(BASE_DIR, "engine_3d4d.html")
OUTPUT_DIR = os.path.join(os.path.dirname(BASE_DIR), "data", "generated_games")

# Funciones del motor que los sirvientes pueden tocar, con su rol experto.
# Mantener esta lista fija evita que el planificador invente nombres que
# no existen en el motor real.
EDITABLE_FUNCTIONS = {
    "generateWorld": ("level_designer", "Genera el layout del nivel: estructuras, cristales, portales, posiciones."),
    "updateEntities": ("ai_engineer", "Comportamiento e IA de enemigos/NPCs (patrol/chase/flee, spawns, daño)."),
    "updatePlayer": ("physics_engineer", "Física y colisiones del jugador (movimiento, gravedad, salto)."),
    "renderBloom": ("fx_engineer", "Post-procesado visual: bloom, glow, color grading."),
    "playSound": ("audio_engineer", "Efectos de sonido via Web Audio API (osciladores, no archivos externos)."),
    "createTesseract": ("mesh_engineer", "Geometría del tesseracto 4D existente."),
    "createIcosahedron": ("mesh_engineer", "Geometría del icosaedro existente."),
    "createOctahedron": ("mesh_engineer", "Geometría del octaedro existente."),
    "createCube": ("mesh_engineer", "Geometría del cubo existente."),
    "createTrianglePrism": ("mesh_engineer", "Geometría del prisma triangular existente."),
    "createHexPrism": ("mesh_engineer", "Geometría del prisma hexagonal existente."),
}

MESH_ENGINEER_ROLE = "mesh_engineer"

ROLE_SYSTEM_PROMPTS = {
    "level_designer": (
        "Eres un level designer experto en espacios 3D/4D poligonales. "
        "Trabajas SOLO sobre la función generateWorld() de un motor WebGL2 "
        "que usa un objeto STATE con arrays: structures, crystals, portals, "
        "tesseracts, entities. Sigue exactamente ese patrón de datos."
    ),
    "ai_engineer": (
        "Eres un ingeniero de IA de enemigos/NPCs para un motor de juego WebGL2. "
        "Trabajas SOLO sobre updateEntities(dt), que itera STATE.entities y "
        "actualiza posición/estado/daño cada frame."
    ),
    "physics_engineer": (
        "Eres un ingeniero de física y colisiones para un motor WebGL2 en "
        "primera persona. Trabajas SOLO sobre updatePlayer(dt)."
    ),
    "fx_engineer": (
        "Eres un artista técnico de shaders y post-procesado WebGL2. "
        "Trabajas SOLO sobre renderBloom(), que aplica bloom/glow sobre un "
        "framebuffer ya renderizado."
    ),
    "audio_engineer": (
        "Eres un ingeniero de audio procedural con Web Audio API (osciladores "
        "y envolventes, NUNCA archivos de audio externos). Trabajas SOLO "
        "sobre playSound(type)."
    ),
    "mesh_engineer": (
        "Eres un ingeniero de geometría/polígonos para un motor WebGL2 crudo "
        "(sin Three.js). Generas arrays planos de vértices/índices/normales "
        "compatibles con uploadMesh(geom, color), siguiendo el estilo de las "
        "funciones create*() existentes (createCube, createIcosahedron, etc.)."
    ),
}


@dataclass
class Fragment:
    function: str
    role: str
    instruction: str
    is_new: bool = False
    code: str = ""
    error: str = ""


@dataclass
class DesignResult:
    success: bool
    message: str
    html_path: Optional[str] = None
    fragments: List[Fragment] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)


class PolygonArchitect:
    """Arquitecto de videojuegos poligonales 3D/4D con sirvientes especializados."""

    MAX_FRAGMENTS = 5

    def __init__(self):
        with open(TEMPLATE_PATH, "r", encoding="utf-8") as f:
            self._template = f.read()
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        self._stats = {"designs": 0, "fragments_generated": 0, "validation_failures": 0}

    # ------------------------------------------------------------------
    # FASE 1: PLANIFICAR
    # ------------------------------------------------------------------

    def _plan(self, request: str) -> List[Fragment]:
        from api_router import get_router, APIProvider

        router = get_router()
        catalog = "\n".join(
            f'- "{name}" (sirviente: {role}): {desc}'
            for name, (role, desc) in EDITABLE_FUNCTIONS.items()
        )

        plan_prompt = f"""Un usuario pide este diseño de nivel/juego 3D poligonal:
"{request}"

Funciones editables del motor (elige SOLO entre estas, o propone una malla nueva):
{catalog}

También puedes pedir una malla/polígono COMPLETAMENTE NUEVO si el diseño lo
requiere (ej. una forma que no existe en la lista), usando "function":
"new_mesh:NombreDescriptivo" con "role": "mesh_engineer".

Máximo {self.MAX_FRAGMENTS} fragmentos. Responde SOLO con JSON:
{{"fragments": [{{"function": "generateWorld", "role": "level_designer", "instruction": "..."}}]}}"""

        response = router.call_specific(
            provider=APIProvider.OPENROUTER,
            model="anthropic/claude-haiku-4.5",
            prompt=plan_prompt,
            system="Eres un director técnico de videojuegos. Responde SOLO con JSON valido.",
            max_tokens=800,
        )

        plan_data = self._parse_json(response)
        if not plan_data or "fragments" not in plan_data:
            # Fallback conservador: solo tocar el nivel
            return [Fragment(
                function="generateWorld", role="level_designer",
                instruction=request,
            )]

        fragments = []
        for f in plan_data["fragments"][: self.MAX_FRAGMENTS]:
            fn = str(f.get("function", "")).strip()
            role = f.get("role", "")
            is_new = fn.startswith("new_mesh:")
            if not is_new and fn not in EDITABLE_FUNCTIONS:
                continue
            if not is_new:
                role = EDITABLE_FUNCTIONS[fn][0]
            fragments.append(Fragment(
                function=fn, role=role or MESH_ENGINEER_ROLE,
                instruction=f.get("instruction", request), is_new=is_new,
            ))
        return fragments or [Fragment(function="generateWorld", role="level_designer", instruction=request)]

    # ------------------------------------------------------------------
    # FASE 2: FRAGMENTAR (sirvientes en paralelo)
    # ------------------------------------------------------------------

    def _generate_fragment(self, fragment: Fragment) -> Fragment:
        from api_router import get_router

        router = get_router()
        system = ROLE_SYSTEM_PROMPTS.get(fragment.role, ROLE_SYSTEM_PROMPTS[MESH_ENGINEER_ROLE])

        if fragment.is_new:
            mesh_name = fragment.function.split(":", 1)[1] if ":" in fragment.function else "CustomMesh"
            mesh_name = re.sub(r"[^A-Za-z0-9]", "", mesh_name) or "CustomMesh"
            fn_name = f"create{mesh_name}"
            fragment.function = fn_name
            prompt = f"""Crea una función JS nueva `function {fn_name}(){{ ... }}` que devuelva
un objeto geometry (vertices, indices, normals como arrays planos) para esta forma:
"{fragment.instruction}"

Sigue EXACTAMENTE el estilo de createCube()/createIcosahedron() del motor.
Devuelve SOLO el código de la función, sin markdown ni explicación."""
        else:
            original = self._extract_function(self._template, fragment.function)
            prompt = f"""Función original:
```js
{original}
```

Instrucción: {fragment.instruction}

Devuelve la función COMPLETA modificada, misma firma `function {fragment.function}(...)`,
sin markdown ni explicación, solo el código JS."""

        response = router.smart(prompt=prompt, system=system, max_tokens=2048)
        fragment.code = self._strip_markdown(response or "")
        if not fragment.code or f"function {fragment.function}" not in fragment.code:
            fragment.error = "El sirviente no devolvió una función válida"
        return fragment

    def _generate_all(self, fragments: List[Fragment]) -> List[Fragment]:
        # Las mallas nuevas van primero para que level_designer pueda
        # referenciarlas por nombre si el plan las menciona.
        new_meshes = [f for f in fragments if f.is_new]
        others = [f for f in fragments if not f.is_new]

        results: List[Fragment] = []
        with ThreadPoolExecutor(max_workers=max(len(fragments), 1)) as pool:
            futures = {pool.submit(self._generate_fragment, f): f for f in new_meshes + others}
            for fut in as_completed(futures):
                results.append(fut.result())
                self._stats["fragments_generated"] += 1
        return results

    # ------------------------------------------------------------------
    # FASE 3: ENSAMBLAR
    # ------------------------------------------------------------------

    def _extract_function(self, source: str, name: str) -> Optional[str]:
        match = re.search(r"function\s+" + re.escape(name) + r"\s*\([^)]*\)\s*\{", source)
        if not match:
            return None
        start = match.start()
        brace_start = match.end() - 1
        depth = 0
        for i in range(brace_start, len(source)):
            if source[i] == "{":
                depth += 1
            elif source[i] == "}":
                depth -= 1
                if depth == 0:
                    return source[start:i + 1]
        return None

    def _splice(self, fragments: List[Fragment]) -> str:
        html = self._template
        new_functions = []

        for frag in fragments:
            if frag.error or not frag.code:
                continue
            if frag.is_new:
                new_functions.append(frag.code)
                continue
            original = self._extract_function(html, frag.function)
            if original:
                html = html.replace(original, frag.code, 1)

        if new_functions:
            marker = "function initMeshes(){"
            insert_at = html.find(marker)
            if insert_at >= 0:
                block = "\n\n" + "\n\n".join(new_functions) + "\n\n"
                html = html[:insert_at] + block + html[insert_at:]

        return html

    # ------------------------------------------------------------------
    # FASE 4: VALIDAR
    # ------------------------------------------------------------------

    def _validate(self, html: str) -> List[str]:
        errors = []
        script_match = re.search(r"<script>(.*)</script>", html, re.DOTALL)
        if not script_match:
            return ["No se encontró bloque <script> en el HTML generado"]
        script = script_match.group(1)

        if script.count("{") != script.count("}"):
            errors.append("Llaves { } desbalanceadas en el script")
        if script.count("(") != script.count(")"):
            errors.append("Parentesis ( ) desbalanceados en el script")

        node = self._find_node()
        if node:
            with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tmp:
                tmp.write(script)
                tmp_path = tmp.name
            try:
                proc = subprocess.run(
                    [node, "--check", tmp_path],
                    capture_output=True, text=True, timeout=15,
                )
                if proc.returncode != 0:
                    errors.append(f"node --check: {proc.stderr.strip()[:300]}")
            except Exception as e:
                logger.warning(f"No se pudo validar con node: {e}")
            finally:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
        return errors

    def _find_node(self) -> Optional[str]:
        import shutil
        return shutil.which("node")

    # ------------------------------------------------------------------
    # ORQUESTADOR PRINCIPAL
    # ------------------------------------------------------------------

    def design(self, request: str) -> DesignResult:
        self._stats["designs"] += 1

        fragments = self._plan(request)
        fragments = self._generate_all(fragments)
        html = self._splice(fragments)
        errors = self._validate(html)

        if errors:
            self._stats["validation_failures"] += 1
            return DesignResult(
                success=False,
                message="❌ El diseño generado no pasó validación:\n" + "\n".join(f"  • {e}" for e in errors),
                fragments=fragments,
                errors=errors,
            )

        slug = re.sub(r"[^a-z0-9]+", "-", request.lower())[:40].strip("-") or "juego"
        filename = f"{slug}-{int(time.time())}.html"
        path = os.path.join(OUTPUT_DIR, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)

        used = ", ".join(f"{f.function} ({f.role})" for f in fragments if not f.error)
        return DesignResult(
            success=True,
            message=f"✅ *Diseño listo*\n\nSirvientes usados: {used}",
            html_path=path,
            fragments=fragments,
        )

    def get_stats_text(self) -> str:
        s = self._stats
        return (
            f"🏗️ *Polygon Architect*\n"
            f"🎮 Diseños: {s['designs']}\n"
            f"🧩 Fragmentos generados: {s['fragments_generated']}\n"
            f"❌ Validaciones fallidas: {s['validation_failures']}"
        )

    # ------------------------------------------------------------------
    # UTILIDADES
    # ------------------------------------------------------------------

    def _strip_markdown(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        return text.strip()

    def _parse_json(self, response: Optional[str]) -> Optional[Dict]:
        if not response:
            return None
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


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_architect_instance: Optional[PolygonArchitect] = None


def get_architect() -> PolygonArchitect:
    global _architect_instance
    if _architect_instance is None:
        _architect_instance = PolygonArchitect()
    return _architect_instance
