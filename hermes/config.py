import os

# All keys read from environment variables — NEVER hardcode secrets
TELEGRAM_BOT_TOKEN = os.environ.get("HERMES_BOT_TOKEN", "")
BOT_NAME = "hermes_c8l_bot"
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "")
GROUP_CHAT_ID = os.environ.get("GROUP_CHAT_ID", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
AI_MODEL = "deepseek/deepseek-v4-flash:free"
AI_MODEL_FAST = "qwen/qwen3-30b-a3b:free"
POLLINATIONS_API_KEY = os.environ.get("POLLINATIONS_API_KEY", "")
POLLINATIONS_BASE_URL = "https://gen.pollinations.ai"
HUGGINGFACE_TOKEN = os.environ.get("HUGGINGFACE_TOKEN", "")
HERMES_PERSONALITY = "Eres Hermes, el mensajero del Panteon C8L. Rapido, eficiente, leal. Hablas directo con energia. Usas emojis moderado. Firme pero justo. Tu lema: Hermes entrega. Siempre."
MAX_WARNINGS = 3
SPAM_THRESHOLD = 5
BANNED_WORDS = ["scam", "free money", "click here", "porn", "xxx"]
AUTO_POST_INTERVAL_HOURS = 4
PORT = int(os.environ.get("PORT", "8081"))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MEMORY_DIR = os.path.join(DATA_DIR, "memory")
STATS_DIR = os.path.join(DATA_DIR, "stats")
os.makedirs(MEMORY_DIR, exist_ok=True)
os.makedirs(STATS_DIR, exist_ok=True)
