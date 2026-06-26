# -*- coding: utf-8 -*-
"""
💳 STRIPE INTEGRATION — Pasarela de pago para C8L Agency
ESTADO: PREPARADO pero NO ACTIVO. Se activa cuando Leo ponga su Stripe key.

Flujo:
  1. Usuario quiere Premium → bot genera link de pago Stripe
  2. Usuario paga → Stripe webhook confirma
  3. Bot activa Premium automáticamente + genera factura

Necesita:
  - STRIPE_SECRET_KEY (sk_live_... o sk_test_...)
  - STRIPE_WEBHOOK_SECRET (whsec_...)
  - Endpoint webhook: /api/stripe/webhook en el bot HTTP

IMPORTANTE: NO se activa hasta que Leo configure las keys.
"""

import os
import json
import logging
import time
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger("c8l.stripe")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class StripeManager:
    """Gestiona pagos con Stripe (preparado, no activo)."""

    def __init__(self):
        self.secret_key = os.environ.get("STRIPE_SECRET_KEY", "")
        self.webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
        self._active = bool(self.secret_key and self.secret_key.startswith("sk_"))

    def is_active(self) -> bool:
        """¿Stripe está configurado y activo?"""
        return self._active

    def create_checkout_session(
        self,
        plan_id: str,
        customer_email: str = "",
        customer_telegram_id: str = "",
        success_url: str = "https://gen-lang-client-0744582882.web.app/perfil?payment=success",
        cancel_url: str = "https://gen-lang-client-0744582882.web.app/perfil?payment=cancel",
    ) -> Dict:
        """
        Crea una sesión de checkout en Stripe.
        El usuario es redirigido a la página de pago de Stripe.

        Returns:
            {"success": bool, "checkout_url": str, "session_id": str}
        """
        if not self.is_active():
            return {
                "success": False,
                "error": "Stripe no configurado. Contacta a Leo para activar pagos.",
                "checkout_url": "",
            }

        try:
            import stripe
            stripe.api_key = self.secret_key

            # Precios por plan
            plans = {
                "premium_monthly": {"price_cents": 999, "name": "C8L Premium Mensual"},
                "premium_yearly": {"price_cents": 7999, "name": "C8L Premium Anual"},
            }

            plan = plans.get(plan_id)
            if not plan:
                return {"success": False, "error": f"Plan '{plan_id}' no existe"}

            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "eur",
                        "product_data": {"name": plan["name"]},
                        "unit_amount": plan["price_cents"],
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "plan_id": plan_id,
                    "telegram_id": customer_telegram_id,
                },
                customer_email=customer_email or None,
            )

            logger.info(f"💳 Stripe checkout creado: {session.id} plan={plan_id}")
            return {
                "success": True,
                "checkout_url": session.url,
                "session_id": session.id,
            }

        except ImportError:
            return {"success": False, "error": "Módulo 'stripe' no instalado. pip install stripe"}
        except Exception as e:
            logger.error(f"💳 Stripe error: {e}")
            return {"success": False, "error": str(e)}

    def handle_webhook(self, payload: bytes, sig_header: str) -> Dict:
        """
        Procesa webhook de Stripe cuando se confirma un pago.
        Llamado desde el endpoint HTTP /api/stripe/webhook.

        Returns:
            {"success": bool, "action": str, "telegram_id": str, "plan_id": str}
        """
        if not self.is_active():
            return {"success": False, "error": "Stripe no activo"}

        try:
            import stripe
            stripe.api_key = self.secret_key

            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )

            if event["type"] == "checkout.session.completed":
                session = event["data"]["object"]
                metadata = session.get("metadata", {})
                telegram_id = metadata.get("telegram_id", "")
                plan_id = metadata.get("plan_id", "")
                customer_email = session.get("customer_email", "")

                if telegram_id and plan_id:
                    # Activar premium
                    self._activate_premium(telegram_id, plan_id, customer_email)

                    # Crear factura
                    self._create_invoice(session, plan_id)

                    logger.info(f"💳 Pago confirmado: user={telegram_id} plan={plan_id}")
                    return {
                        "success": True,
                        "action": "premium_activated",
                        "telegram_id": telegram_id,
                        "plan_id": plan_id,
                    }

            return {"success": True, "action": "ignored", "event_type": event["type"]}

        except ImportError:
            return {"success": False, "error": "Módulo 'stripe' no instalado"}
        except Exception as e:
            logger.error(f"💳 Webhook error: {e}")
            return {"success": False, "error": str(e)}

    def _activate_premium(self, telegram_id: str, plan_id: str, email: str = ""):
        """Activa premium para un usuario tras pago confirmado."""
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            cm.set_tier(str(telegram_id), "premium")
            cm.set_name(str(telegram_id), email or f"user_{telegram_id}")
            logger.info(f"💳 Premium activado para user={telegram_id}")
        except Exception as e:
            logger.error(f"💳 Error activando premium: {e}")

    def _create_invoice(self, session: dict, plan_id: str):
        """Crea factura automática tras pago."""
        try:
            from billing import get_billing
            billing = get_billing()
            if billing.is_active():
                customer = {
                    "name": session.get("customer_details", {}).get("name", ""),
                    "email": session.get("customer_email", ""),
                    "country": session.get("customer_details", {}).get("address", {}).get("country", "ES"),
                    "vat_id": "",
                }
                billing.create_invoice(
                    customer=customer,
                    plan_id=plan_id,
                    payment_method="stripe",
                    payment_id=session.get("payment_intent", ""),
                )
        except Exception as e:
            logger.error(f"💳 Error creando factura: {e}")

    def get_payment_link(self, plan_id: str, telegram_id: str) -> str:
        """Genera mensaje con link de pago para el bot de Telegram."""
        result = self.create_checkout_session(
            plan_id=plan_id,
            customer_telegram_id=telegram_id,
        )
        if result["success"]:
            return (
                f"💳 *Activar C8L Premium*\n\n"
                f"🔗 [Pagar aquí]({result['checkout_url']})\n\n"
                f"✅ Se activa automáticamente tras el pago.\n"
                f"🧾 Recibirás factura por email."
            )
        return f"⚠️ {result.get('error', 'Error generando link de pago')}"


# Singleton
_stripe: Optional[StripeManager] = None


def get_stripe() -> StripeManager:
    global _stripe
    if _stripe is None:
        _stripe = StripeManager()
    return _stripe
