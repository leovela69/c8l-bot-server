# -*- coding: utf-8 -*-
"""
👑 ADMIN PANEL — Panel de control para Leo via Telegram
Comandos solo para admin (ID 1970956749):

  /admin             — Resumen general
  /admin_users       — Ver usuarios y tiers
  /admin_codes       — Ver códigos premium activos
  /admin_gencode     — Generar código premium
  /admin_gencode 5   — Generar 5 códigos
  /admin_set_premium USER_ID  — Dar premium directo
  /admin_billing     — Resumen facturación
  /admin_quarterly   — Modelo 303 (trimestre actual)
  /admin_credits     — Créditos MusicAPI restantes
"""

import logging
from typing import Dict
from datetime import datetime

logger = logging.getLogger("c8l.admin")


class AdminPanel:
    """Panel de administración via Telegram."""

    def __init__(self, admin_id: str = "1970956749"):
        self.admin_id = str(admin_id)

    def is_admin(self, user_id: str) -> bool:
        return str(user_id) == self.admin_id

    # ===== RESUMEN GENERAL =====

    def get_summary(self) -> str:
        """Resumen general del sistema."""
        parts = ["👑 *PANEL ADMIN — C8L Agency*\n"]

        # MusicAPI credits
        try:
            from musicapi_client import MusicAPIClient
            client = MusicAPIClient()
            credits = client.get_credits()
            parts.append(f"🎵 MusicAPI: {credits.get('credits', '?')} créditos")
        except Exception:
            parts.append("🎵 MusicAPI: Error obteniendo créditos")

        # Usuarios
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            users = cm._data.get("users", {})
            total_users = len(users)
            premium_users = sum(1 for u in users.values() if u.get("tier") == "premium")
            total_gens = cm._data.get("total_generations", 0)
            parts.append(f"👥 Usuarios: {total_users} total, {premium_users} premium")
            parts.append(f"🎵 Generaciones totales: {total_gens}")
        except Exception:
            parts.append("👥 Usuarios: Error")

        # Códigos
        try:
            from premium_codes import get_premium_manager
            pm = get_premium_manager()
            stats = pm.get_stats()
            parts.append(f"🎫 Códigos: {stats['active_codes']} activos, {stats['total_used']} usados")
        except Exception:
            parts.append("🎫 Códigos: Error")

        # Facturación
        try:
            from billing import get_billing
            billing = get_billing()
            parts.append(f"🧾 Facturación: {'ACTIVA' if billing.is_active() else 'NO ACTIVA'}")
        except Exception:
            parts.append("🧾 Facturación: Error")

        # Stripe
        try:
            from stripe_integration import get_stripe
            stripe = get_stripe()
            parts.append(f"💳 Stripe: {'ACTIVO' if stripe.is_active() else 'NO CONFIGURADO'}")
        except Exception:
            parts.append("💳 Stripe: Error")

        parts.append(f"\n⏰ {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        return "\n".join(parts)

    # ===== USUARIOS =====

    def get_users_list(self) -> str:
        """Lista de usuarios con tiers."""
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            users = cm._data.get("users", {})

            if not users:
                return "👥 No hay usuarios registrados aún."

            lines = ["👥 *USUARIOS REGISTRADOS*\n"]
            for uid, data in sorted(users.items(), key=lambda x: x[1].get("total_count", 0), reverse=True)[:20]:
                tier_emoji = {"admin": "👑", "premium": "⭐", "free": "🆓"}.get(data.get("tier", "free"), "🆓")
                name = data.get("name", uid)[:15]
                total = data.get("total_count", 0)
                today = data.get("daily_count", 0)
                lines.append(f"{tier_emoji} `{uid}` {name} — {total} total, {today} hoy")

            return "\n".join(lines)
        except Exception as e:
            return f"❌ Error: {e}"

    # ===== CÓDIGOS =====

    def generate_codes(self, count: int = 1, days: int = 30) -> str:
        """Genera códigos premium."""
        try:
            from premium_codes import get_premium_manager
            pm = get_premium_manager()
            codes = pm.generate_batch(count=count, duration_days=days)
            lines = [f"🎫 *{count} código(s) generado(s)* ({days} días premium)\n"]
            for code in codes:
                lines.append(f"  `{code}`")
            lines.append(f"\nUso: `/premium CÓDIGO`")
            return "\n".join(lines)
        except Exception as e:
            return f"❌ Error: {e}"

    def get_active_codes(self) -> str:
        """Lista códigos activos."""
        try:
            from premium_codes import get_premium_manager
            pm = get_premium_manager()
            codes = pm.get_active_codes()

            if not codes:
                return "🎫 No hay códigos activos. Usa /admin\\_gencode para crear."

            lines = ["🎫 *CÓDIGOS ACTIVOS*\n"]
            for c in codes:
                lines.append(f"  `{c['code']}` — {c['duration_days']}d, expira {c['expires_at']}")

            return "\n".join(lines)
        except Exception as e:
            return f"❌ Error: {e}"

    # ===== SET PREMIUM DIRECTO =====

    def set_premium_direct(self, target_user_id: str) -> str:
        """Da premium directamente a un usuario."""
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            cm.set_tier(str(target_user_id), "premium")
            return f"⭐ Premium activado para user `{target_user_id}`"
        except Exception as e:
            return f"❌ Error: {e}"

    # ===== FACTURACIÓN =====

    def get_billing_summary(self) -> str:
        """Resumen de facturación."""
        try:
            from billing import get_billing
            billing = get_billing()
            invoices = billing.get_invoices(limit=10)

            lines = [f"🧾 *FACTURACIÓN* ({'ACTIVA' if billing.is_active() else 'NO ACTIVA'})\n"]

            if not invoices:
                lines.append("No hay facturas emitidas.")
            else:
                total = sum(inv["total"] for inv in invoices)
                lines.append(f"📊 Últimas {len(invoices)} facturas: {total:.2f}€ total\n")
                for inv in invoices[-5:]:
                    lines.append(
                        f"  {inv['invoice_number']} — {inv['total']:.2f}€ "
                        f"({inv['customer'].get('name', '?')[:15]})"
                    )

            return "\n".join(lines)
        except Exception as e:
            return f"❌ Error: {e}"

    def get_quarterly(self) -> str:
        """Modelo 303 — resumen trimestral."""
        try:
            from billing import get_billing
            billing = get_billing()
            q = billing.get_quarterly_summary()
            return (
                f"🧾 *MODELO 303 — {q['period']}*\n\n"
                f"📄 Facturas emitidas: {q['invoices_count']}\n"
                f"💰 Base imponible: {q['total_base_imponible']:.2f}€\n"
                f"🏛️ IVA repercutido: {q['total_iva_repercutido']:.2f}€\n"
                f"📊 Total facturado: {q['total_facturado']:.2f}€\n\n"
                f"💸 Cuota a ingresar: {q['modelo_303_cuota']:.2f}€"
            )
        except Exception as e:
            return f"❌ Error: {e}"

    # ===== MUSICAPI CREDITS =====

    def get_musicapi_credits(self) -> str:
        """Créditos MusicAPI restantes."""
        try:
            from musicapi_client import MusicAPIClient
            client = MusicAPIClient()
            credits = client.get_credits()
            c = credits.get("credits", 0)
            songs = c // 15
            return (
                f"🎵 *MusicAPI Credits*\n\n"
                f"💰 Créditos: {c}\n"
                f"🎵 Canciones restantes: ~{songs}\n"
                f"📊 Cada canción = 15 créditos (2 variaciones)"
            )
        except Exception as e:
            return f"❌ Error: {e}"


# Singleton
_panel = None


def get_admin_panel() -> AdminPanel:
    global _panel
    if _panel is None:
        _panel = AdminPanel()
    return _panel
