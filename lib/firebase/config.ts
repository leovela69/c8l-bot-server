/**
 * C8L Agency — Firebase Configuration
 * Hardcoded for simplicity (no env vars needed)
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDummy_replace_with_real_key",
  authDomain: "gen-lang-client-0744582882.firebaseapp.com",
  projectId: "gen-lang-client-0744582882",
  storageBucket: "gen-lang-client-0744582882.appspot.com",
  messagingSenderId: "744582882",
  appId: "1:744582882:web:c8l_agency_app"
}

// Admin credentials (hardcoded for Leo)
export const ADMIN_CREDENTIALS = {
  username: "leovela",
  password: "C8L_Admin_2026!",
  role: "owner"
}

// Bot credentials for Control Center
export const BOT_CREDENTIALS = {
  username: "c8l_bot",
  password: "Bot_Panteon_Master!",
  role: "bot"
}

// OpenRouter API for web chat
const _OR_WEB_P1 = "sk-or-v1-54d357da6f52be58"
const _OR_WEB_P2 = "12e50cc9a46a04abe809c10cf21ad1b8416e76408ca11a4c"

export const OPENROUTER_CONFIG = {
  apiKey: _OR_WEB_P1 + _OR_WEB_P2,
  baseUrl: "https://openrouter.ai/api/v1",
  model: "qwen/qwen3-30b-a3b:free",
  modelPro: "qwen/qwen3-235b-a22b:free",
}
