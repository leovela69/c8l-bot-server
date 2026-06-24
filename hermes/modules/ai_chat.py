import requests, re, logging
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, AI_MODEL, AI_MODEL_FAST, HERMES_PERSONALITY
logger = logging.getLogger("hermes.ai")
conversations = {}

def chat(user_id, user_message, username="usuario", fast=False):
    uid = str(user_id)
    if uid not in conversations:
        conversations[uid] = []
    conversations[uid].append({"role": "user", "content": user_message})
    if len(conversations[uid]) > 20:
        conversations[uid] = conversations[uid][-20:]
    messages = [{"role": "system", "content": HERMES_PERSONALITY}] + conversations[uid]
    model = AI_MODEL_FAST if fast else AI_MODEL
    try:
        r = requests.post(
            OPENROUTER_BASE_URL + "/chat/completions",
            headers={"Authorization": "Bearer " + OPENROUTER_API_KEY, "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": 800, "temperature": 0.8},
            timeout=30
        )
        if r.status_code == 200:
            reply = r.json()["choices"][0]["message"]["content"].strip()
            reply = re.sub(r'<think>.*?</think>', '', reply, flags=re.DOTALL).strip()
            conversations[uid].append({"role": "assistant", "content": reply})
            return reply
        return "Error de IA. Intenta de nuevo."
    except:
        return "Error de conexion."

def clear_history(user_id):
    conversations.pop(str(user_id), None)

def chat_with_search(user_id, msg, username="usuario"):
    context = ""
    triggers = ["que es", "quien es", "busca", "donde", "cuando"]
    if any(t in msg.lower() for t in triggers):
        try:
            r = requests.get("https://api.duckduckgo.com/?q=" + requests.utils.quote(msg) + "&format=json&no_html=1", timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("AbstractText"):
                    context = "\n[Web]: " + data["AbstractText"]
        except:
            pass
    return chat(user_id, msg + context, username)
