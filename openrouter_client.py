# -*- coding: utf-8 -*-
"""
🏛️ OpenRouter Client — Motor unificado del Panteon
Un solo cliente para llamar a cualquier modelo via OpenRouter.
Fallback a NVIDIA si OpenRouter falla.
"""

import requests
import logging
import time
from config import (
    OPENROUTER_API_KEY, OPENROUTER_BASE_URL,
    NVIDIA_API_KEY, NVIDIA_BASE_URL, NVIDIA_MODEL,
    MODELS
)

logger = logging.getLogger("c8l.openrouter")

# Rate limiting simple
_last_call_time = 0
MIN_CALL_INTERVAL = 0.5  # 500ms entre llamadas


def call_openrouter(prompt, system_prompt="", agent_name="zeus", temperature=0.85, max_tokens=4096):
    """
    Llama a OpenRouter con el modelo asignado al agente.
    MEJORADO: Intenta hasta 4 modelos diferentes antes de fallar.

    Args:
        prompt: El mensaje del usuario
        system_prompt: Instrucciones del sistema para el agente
        agent_name: Nombre del agente (zeus, minerva, vulcano, etc.)
        temperature: Creatividad (0.0 - 1.0)
        max_tokens: Maximo de tokens en la respuesta

    Returns:
        str: Respuesta del modelo o None si falla todo
    """
    global _last_call_time

    # Rate limiting
    elapsed = time.time() - _last_call_time
    if elapsed < MIN_CALL_INTERVAL:
        time.sleep(MIN_CALL_INTERVAL - elapsed)
    _last_call_time = time.time()

    # Seleccionar modelo para este agente
    model = MODELS.get(agent_name, MODELS["fallback"])

    # Construir mensajes
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    # Lista de modelos a intentar (en orden de preferencia)
    models_to_try = [
        model,
        MODELS["fallback"],
        "deepseek/deepseek-chat-v3-0324:free",
        "qwen/qwen3-30b-a3b:free",
        "qwen/qwen3.6-plus:free",
    ]
    # Eliminar duplicados manteniendo orden
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    # Intentar cada modelo
    for i, try_model in enumerate(models_to_try):
        try:
            response = _call_openrouter_api(messages, try_model, temperature, max_tokens)
            if response and len(response.strip()) > 5:
                if i > 0:
                    logger.info(f"[{agent_name.upper()}] OK via modelo alternativo #{i+1} ({try_model})")
                else:
                    logger.info(f"[{agent_name.upper()}] OK via OpenRouter ({try_model})")
                return response
            else:
                logger.warning(f"[{agent_name.upper()}] {try_model} devolvio respuesta vacia")
        except Exception as e:
            logger.warning(f"[{agent_name.upper()}] {try_model} fallo: {str(e)[:80]}")
        # Pausa entre intentos
        if i < len(models_to_try) - 1:
            time.sleep(1)

    # Ultimo recurso: NVIDIA
    try:
        response = _call_nvidia_api(messages, temperature, max_tokens)
        if response and len(response.strip()) > 5:
            logger.info(f"[{agent_name.upper()}] OK via NVIDIA backup")
            return response
    except Exception as e:
        logger.warning(f"[{agent_name.upper()}] NVIDIA backup fallo: {str(e)[:80]}")

    logger.error(f"[{agent_name.upper()}] TODOS LOS MODELOS FALLARON ({len(models_to_try)} intentos + NVIDIA)")
    return None


def call_openrouter_with_history(messages, agent_name="zeus", temperature=0.85, max_tokens=4096):
    """
    Llama a OpenRouter con historial completo de mensajes.
    Util para conversaciones multi-turno.

    Args:
        messages: Lista de {"role": "system/user/assistant", "content": "..."}
        agent_name: Nombre del agente
        temperature: Creatividad
        max_tokens: Maximo tokens

    Returns:
        str: Respuesta del modelo o None
    """
    global _last_call_time

    elapsed = time.time() - _last_call_time
    if elapsed < MIN_CALL_INTERVAL:
        time.sleep(MIN_CALL_INTERVAL - elapsed)
    _last_call_time = time.time()

    model = MODELS.get(agent_name, MODELS["fallback"])

    try:
        response = _call_openrouter_api(messages, model, temperature, max_tokens)
        if response:
            return response
    except Exception as e:
        logger.warning(f"[{agent_name.upper()}] OpenRouter fallo: {str(e)[:80]}")

    # Fallback
    try:
        response = _call_openrouter_api(messages, MODELS["fallback"], temperature, max_tokens)
        if response:
            return response
    except Exception as e:
        logger.warning(f"[{agent_name.upper()}] Fallback fallo: {str(e)[:80]}")

    # NVIDIA
    try:
        response = _call_nvidia_api(messages, temperature, max_tokens)
        if response:
            return response
    except:
        pass

    return None


def _call_openrouter_api(messages, model, temperature, max_tokens):
    """Llamada directa a la API de OpenRouter."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://c8lagency.com",
        "X-Title": "C8L Agency Bot",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    r = requests.post(
        f"{OPENROUTER_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=90
    )

    if r.status_code == 429:
        # Rate limited — esperar y reintentar una vez
        time.sleep(2)
        r = requests.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=90
        )

    r.raise_for_status()
    data = r.json()

    # Extraer respuesta
    if "choices" in data and len(data["choices"]) > 0:
        content = data["choices"][0].get("message", {}).get("content", "")
        if content:
            return content.strip()

    # Algunos modelos devuelven error en el body
    if "error" in data:
        raise Exception(f"API error: {data['error']}")

    return None


def _call_nvidia_api(messages, temperature, max_tokens):
    """Llamada directa a NVIDIA como backup."""
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": NVIDIA_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }

    r = requests.post(
        f"{NVIDIA_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=60
    )
    r.raise_for_status()
    data = r.json()

    if "choices" in data and len(data["choices"]) > 0:
        return data["choices"][0]["message"]["content"].strip()

    return None


def test_connection():
    """Prueba rapida de conectividad con OpenRouter."""
    try:
        result = call_openrouter("Di 'OK' si me escuchas.", agent_name="zeus", max_tokens=10)
        return bool(result)
    except:
        return False
