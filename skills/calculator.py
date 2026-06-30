# -*- coding: utf-8 -*-
"""
🧮 CALCULATOR SKILL — Calculadora Científica
==============================================
Usa sympy para cálculos simbólicos avanzados.
Soporta: aritmética, álgebra, derivadas, integrales, etc.
Fallback: eval seguro para operaciones básicas.
"""

import re
import math
import logging
from typing import Optional

logger = logging.getLogger("c8l.skills.calculator")


class CalculatorSkill:
    """Calculadora científica ultraligera."""

    # Constantes útiles
    CONSTANTS = {
        "pi": math.pi,
        "e": math.e,
        "phi": (1 + math.sqrt(5)) / 2,  # Golden ratio
    }

    # Funciones permitidas en eval seguro
    SAFE_FUNCTIONS = {
        "sqrt": math.sqrt,
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "log": math.log,
        "log10": math.log10,
        "abs": abs,
        "pow": pow,
        "round": round,
        "ceil": math.ceil,
        "floor": math.floor,
        "factorial": math.factorial,
        "pi": math.pi,
        "e": math.e,
    }

    def __init__(self):
        self.calc_count = 0

    def calculate(self, expression: str) -> str:
        """
        Calcula una expresión matemática.

        Args:
            expression: Expresión a calcular

        Returns:
            Resultado formateado
        """
        # Limpiar expresión
        expr = self._clean_expression(expression)

        if not expr:
            return "❌ No pude interpretar la expresión."

        # Intentar sympy primero (más potente)
        result = self._try_sympy(expr)
        if result is not None:
            self.calc_count += 1
            return f"🧮 *Resultado:*\n\n`{expression}` = `{result}`"

        # Fallback: eval seguro
        result = self._safe_eval(expr)
        if result is not None:
            self.calc_count += 1
            return f"🧮 *Resultado:*\n\n`{expression}` = `{result}`"

        return f"❌ No pude calcular: {expression}"

    def convert_units(self, value: float, from_unit: str,
                      to_unit: str) -> Optional[str]:
        """Conversión de unidades básica."""
        conversions = {
            ("km", "mi"): lambda x: x * 0.621371,
            ("mi", "km"): lambda x: x * 1.60934,
            ("kg", "lb"): lambda x: x * 2.20462,
            ("lb", "kg"): lambda x: x * 0.453592,
            ("c", "f"): lambda x: x * 9 / 5 + 32,
            ("f", "c"): lambda x: (x - 32) * 5 / 9,
            ("m", "ft"): lambda x: x * 3.28084,
            ("ft", "m"): lambda x: x * 0.3048,
            ("l", "gal"): lambda x: x * 0.264172,
            ("gal", "l"): lambda x: x * 3.78541,
            ("cm", "in"): lambda x: x * 0.393701,
            ("in", "cm"): lambda x: x * 2.54,
        }

        key = (from_unit.lower(), to_unit.lower())
        if key in conversions:
            result = conversions[key](value)
            return (
                f"🔄 *Conversión:*\n\n"
                f"{value} {from_unit} = {result:.4f} {to_unit}"
            )
        return None

    def _clean_expression(self, expr: str) -> str:
        """Limpia y normaliza la expresión."""
        expr = expr.strip()
        # Reemplazar operadores en español
        replacements = {
            "×": "*", "÷": "/", "^": "**",
            "mas": "+", "menos": "-",
            "por": "*", "entre": "/",
            "elevado a": "**", "al cuadrado": "**2",
            "al cubo": "**3", "raiz de": "sqrt(",
            "raíz de": "sqrt(",
        }
        for old, new in replacements.items():
            expr = expr.replace(old, new)
        # Eliminar texto no matemático
        expr = re.sub(r'[a-záéíóú]{4,}', '', expr, flags=re.IGNORECASE)
        expr = expr.strip()
        return expr

    def _try_sympy(self, expr: str) -> Optional[str]:
        """Intenta calcular con sympy."""
        try:
            import sympy
            result = sympy.sympify(expr)
            # Evaluar numéricamente
            numeric = float(result.evalf())
            # Formatear
            if numeric == int(numeric):
                return str(int(numeric))
            return f"{numeric:.6g}"
        except ImportError:
            return None
        except Exception:
            return None

    def _safe_eval(self, expr: str) -> Optional[str]:
        """Evaluación segura sin acceso a builtins peligrosos."""
        try:
            # Solo permitir caracteres seguros
            if not re.match(r'^[0-9+\-*/().,%\s]+$', expr):
                return None

            result = eval(expr, {"__builtins__": {}}, self.SAFE_FUNCTIONS)

            if isinstance(result, float):
                if result == int(result) and abs(result) < 1e15:
                    return str(int(result))
                return f"{result:.6g}"
            return str(result)
        except Exception:
            return None
