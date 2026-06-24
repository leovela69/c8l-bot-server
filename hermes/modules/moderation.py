import time, json, os, logging
from config import MAX_WARNINGS, SPAM_THRESHOLD, BANNED_WORDS, DATA_DIR, ADMIN_CHAT_ID
logger = logging.getLogger("hermes.mod")
WARNINGS_FILE = os.path.join(DATA_DIR, "warnings.json")
spam_tracker = {}

def load_json(fp):
    try:
        if os.path.exists(fp):
            with open(fp) as f:
                return json.load(f)
    except:
        pass
    return {}

def save_json(fp, data):
    with open(fp, "w") as f:
        json.dump(data, f)

def check_message(message):
    if not message.text:
        return None, {}
    uid = message.from_user.id
    uname = message.from_user.username or message.from_user.first_name or "anon"
    if str(uid) == ADMIN_CHAT_ID:
        return None, {}
    now = time.time()
    sid = str(uid)
    if sid not in spam_tracker:
        spam_tracker[sid] = []
    spam_tracker[sid] = [t for t in spam_tracker[sid] if now - t < 10]
    spam_tracker[sid].append(now)
    if len(spam_tracker[sid]) >= SPAM_THRESHOLD:
        w = add_warning(uid, uname, "Spam")
        if w >= MAX_WARNINGS:
            return 'ban', {"user_id": uid, "username": uname, "reason": "Spam repetido"}
        return 'warn', {"user_id": uid, "username": uname, "reason": f"Spam (aviso {w}/{MAX_WARNINGS})"}
    text_lower = message.text.lower()
    for word in BANNED_WORDS:
        if word in text_lower:
            w = add_warning(uid, uname, "Palabra prohibida")
            if w >= MAX_WARNINGS:
                return 'ban', {"user_id": uid, "username": uname, "reason": "Contenido prohibido"}
            return 'delete', {"user_id": uid, "username": uname, "reason": "Contenido no permitido"}
    return None, {}

def add_warning(uid, uname, reason):
    data = load_json(WARNINGS_FILE)
    sid = str(uid)
    if sid not in data:
        data[sid] = {"username": uname, "count": 0}
    data[sid]["count"] += 1
    data[sid]["username"] = uname
    save_json(WARNINGS_FILE, data)
    return data[sid]["count"]

def get_mod_stats():
    data = load_json(WARNINGS_FILE)
    return {"total_users_warned": len(data), "total_warnings": sum(d["count"] for d in data.values()), "total_bans": 0}
