import threading, time, json, os, random, logging
from config import GROUP_CHAT_ID, AUTO_POST_INTERVAL_HOURS, DATA_DIR
logger = logging.getLogger("hermes.scheduler")
REMINDERS_FILE = os.path.join(DATA_DIR, "reminders.json")

AUTO_MESSAGES = [
    "Hermes reportando: Todo en orden en el Panteon.",
    "Recuerden que pueden crear imagenes con /imagen [estilo] [prompt]",
    "El Panteon C8L esta activo 24/7. Hermes no duerme.",
    "Preguntenme lo que quieran. Hermes entrega. Siempre.",
    "Reto: Manden su mejor prompt de imagen y genero la ganadora",
]

def load_reminders():
    try:
        if os.path.exists(REMINDERS_FILE):
            with open(REMINDERS_FILE) as f:
                return json.load(f)
    except:
        pass
    return []

def save_reminders(r):
    with open(REMINDERS_FILE, "w") as f:
        json.dump(r, f)

def add_reminder(user_id, username, text, minutes):
    reminders = load_reminders()
    reminders.append({"user_id": user_id, "username": username, "text": text, "trigger_time": time.time() + minutes * 60})
    save_reminders(reminders)

def get_auto_message():
    return random.choice(AUTO_MESSAGES)

class AutoPublisher:
    def __init__(self, bot):
        self.bot = bot
    def start(self):
        threading.Thread(target=self._run, daemon=True).start()
    def _run(self):
        time.sleep(300)
        while True:
            try:
                self.bot.send_message(GROUP_CHAT_ID, get_auto_message())
            except:
                pass
            time.sleep(AUTO_POST_INTERVAL_HOURS * 3600)

class ReminderChecker:
    def __init__(self, bot):
        self.bot = bot
    def start(self):
        threading.Thread(target=self._run, daemon=True).start()
    def _run(self):
        while True:
            try:
                reminders = load_reminders()
                now = time.time()
                due = [r for r in reminders if r["trigger_time"] <= now]
                remaining = [r for r in reminders if r["trigger_time"] > now]
                if due:
                    save_reminders(remaining)
                    for r in due:
                        self.bot.send_message(r["user_id"], "Recordatorio: " + r["text"])
            except:
                pass
            time.sleep(30)
