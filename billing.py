# -*- coding: utf-8 -*-
"""
🧾 BILLING — Sistema de facturación automática para C8L Agency
Cumple con normativa española (Hacienda, modelo 303 IVA trimestral).

Features:
  - Facturación automática al activar Premium vía pago
  - IVA 21% España, 0% intracomunitario (NIF-IVA), 0% fuera EU
  - Numeración secuencial: C8L-2026-0001, C8L-2026-0002...
  - Datos empresa: Leo Vela / C8L Agency
  - Exportar CSV para Apolo (contabilidad)
  - Generar PDF de factura

ESTADO: PREPARADO pero NO ACTIVO. Se activa cuando Leo diga.
"""

import json
import os
import time
import logging
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger("c8l.billing")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
BILLING_DIR = os.path.join(DATA_DIR, "billing")
INVOICES_FILE = os.path.join(BILLING_DIR, "invoices.json")
CONFIG_FILE = os.path.join(BILLING_DIR, "billing_config.json")

os.makedirs(BILLING_DIR, exist_ok=True)


# ===== CONFIGURACIÓN EMPRESA =====

DEFAULT_BILLING_CONFIG = {
    "company": {
        "name": "C8L Agency",
        "legal_name": "",  # Leo llenará cuando registre empresa
        "nif": "",  # NIF/CIF de Leo
        "address": "",
        "city": "",
        "postal_code": "",
        "country": "ES",
        "email": "rufinoleon30@gmail.com",
    },
    "tax": {
        "spain_vat_rate": 21.0,  # IVA 21%
        "eu_vat_rate": 0.0,  # Intracomunitario con NIF-IVA
        "non_eu_vat_rate": 0.0,  # Fuera de EU
    },
    "invoice": {
        "prefix": "C8L",
        "next_number": 1,
        "year": datetime.now().year,
        "currency": "EUR",
        "payment_terms_days": 0,  # Pago inmediato (online)
    },
    "plans": {
        "premium_monthly": {
            "name": "C8L Premium Mensual",
            "price": 9.99,  # EUR (sin IVA)
            "description": "5 canciones/día con vocales + letras + variaciones",
            "duration_days": 30,
            "tier": "premium",
        },
        "premium_yearly": {
            "name": "C8L Premium Anual",
            "price": 79.99,  # EUR (sin IVA) — 2 meses gratis
            "description": "5 canciones/día durante 12 meses",
            "duration_days": 365,
            "tier": "premium",
        },
    },
    "active": False,  # ⚠️ NO ACTIVO hasta que Leo diga
}


class BillingManager:
    """Sistema de facturación para C8L Agency."""

    def __init__(self):
        self._config = self._load_config()
        self._invoices = self._load_invoices()

    def _load_config(self) -> dict:
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        # Crear config por defecto
        self._save_config(DEFAULT_BILLING_CONFIG)
        return DEFAULT_BILLING_CONFIG.copy()

    def _save_config(self, config: dict = None):
        config = config or self._config
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)

    def _load_invoices(self) -> list:
        if os.path.exists(INVOICES_FILE):
            try:
                with open(INVOICES_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def _save_invoices(self):
        with open(INVOICES_FILE, 'w', encoding='utf-8') as f:
            json.dump(self._invoices, f, ensure_ascii=False, indent=2)

    # ===== CHECK ACTIVE =====

    def is_active(self) -> bool:
        """¿Está la facturación activa?"""
        return self._config.get("active", False)

    def activate(self):
        """Activa la facturación (solo Leo puede)."""
        self._config["active"] = True
        self._save_config()
        logger.info("🧾 Facturación ACTIVADA")

    def deactivate(self):
        """Desactiva la facturación."""
        self._config["active"] = False
        self._save_config()
        logger.info("🧾 Facturación DESACTIVADA")

    # ===== CALCULAR IVA =====

    def calculate_vat(self, base_price: float, customer_country: str = "ES", customer_vat_id: str = "") -> Dict:
        """
        Calcula el IVA según la ubicación del cliente.

        Args:
            base_price: Precio sin IVA
            customer_country: Código país (ES, FR, DE, US, etc.)
            customer_vat_id: NIF-IVA del cliente (para intracomunitario)

        Returns:
            {"base": float, "vat_rate": float, "vat_amount": float, "total": float, "vat_type": str}
        """
        eu_countries = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
                       "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
                       "MT", "NL", "PL", "PT", "RO", "SK", "SI", "SE"]

        if customer_country == "ES":
            # España: IVA 21%
            vat_rate = self._config["tax"]["spain_vat_rate"]
            vat_type = "IVA 21% (España)"
        elif customer_country in eu_countries and customer_vat_id:
            # Intracomunitario con NIF-IVA: 0%
            vat_rate = 0.0
            vat_type = "Exento IVA (intracomunitario con NIF-IVA)"
        elif customer_country in eu_countries:
            # EU sin NIF-IVA: IVA del país de origen (España 21%)
            vat_rate = self._config["tax"]["spain_vat_rate"]
            vat_type = f"IVA 21% (cliente EU sin NIF-IVA)"
        else:
            # Fuera de EU: 0%
            vat_rate = 0.0
            vat_type = "Exento IVA (fuera de UE)"

        vat_amount = round(base_price * vat_rate / 100, 2)
        total = round(base_price + vat_amount, 2)

        return {
            "base": base_price,
            "vat_rate": vat_rate,
            "vat_amount": vat_amount,
            "total": total,
            "vat_type": vat_type,
        }

    # ===== CREAR FACTURA =====

    def create_invoice(
        self,
        customer: dict,
        plan_id: str,
        payment_method: str = "stripe",
        payment_id: str = "",
    ) -> Dict:
        """
        Crea una factura.

        Args:
            customer: {"name": "...", "email": "...", "country": "ES", "vat_id": "", "address": ""}
            plan_id: ID del plan ("premium_monthly", "premium_yearly")
            payment_method: "stripe", "paypal", "manual"
            payment_id: ID de la transacción

        Returns:
            Factura completa con número secuencial
        """
        if not self.is_active():
            return {"error": "Facturación no activa. Leo debe activarla primero."}

        plan = self._config["plans"].get(plan_id)
        if not plan:
            return {"error": f"Plan '{plan_id}' no existe"}

        # Calcular IVA
        vat_info = self.calculate_vat(
            plan["price"],
            customer.get("country", "ES"),
            customer.get("vat_id", ""),
        )

        # Número de factura secuencial
        year = datetime.now().year
        if self._config["invoice"]["year"] != year:
            self._config["invoice"]["year"] = year
            self._config["invoice"]["next_number"] = 1

        invoice_number = f"{self._config['invoice']['prefix']}-{year}-{self._config['invoice']['next_number']:04d}"
        self._config["invoice"]["next_number"] += 1
        self._save_config()

        # Crear factura
        invoice = {
            "invoice_number": invoice_number,
            "date": datetime.now().isoformat(),
            "due_date": datetime.now().isoformat(),  # Pago inmediato
            "status": "paid",
            "company": self._config["company"],
            "customer": customer,
            "items": [{
                "description": plan["name"],
                "detail": plan["description"],
                "quantity": 1,
                "unit_price": plan["price"],
                "total": plan["price"],
            }],
            "subtotal": vat_info["base"],
            "vat_rate": vat_info["vat_rate"],
            "vat_amount": vat_info["vat_amount"],
            "vat_type": vat_info["vat_type"],
            "total": vat_info["total"],
            "currency": self._config["invoice"]["currency"],
            "payment_method": payment_method,
            "payment_id": payment_id,
            "plan_id": plan_id,
            "notes": "Factura generada automáticamente por C8L Agency.",
        }

        self._invoices.append(invoice)
        self._save_invoices()

        logger.info(f"🧾 Factura creada: {invoice_number} — {vat_info['total']}€ ({customer.get('name', '?')})")
        return invoice

    # ===== CONSULTAR =====

    def get_invoices(self, limit: int = 50) -> List[dict]:
        """Lista últimas facturas."""
        return self._invoices[-limit:]

    def get_quarterly_summary(self, quarter: int = None, year: int = None) -> Dict:
        """Resumen trimestral para modelo 303."""
        year = year or datetime.now().year
        quarter = quarter or ((datetime.now().month - 1) // 3 + 1)

        # Meses del trimestre
        start_month = (quarter - 1) * 3 + 1
        end_month = start_month + 2

        quarter_invoices = []
        for inv in self._invoices:
            inv_date = datetime.fromisoformat(inv["date"])
            if inv_date.year == year and start_month <= inv_date.month <= end_month:
                quarter_invoices.append(inv)

        total_base = sum(inv["subtotal"] for inv in quarter_invoices)
        total_vat = sum(inv["vat_amount"] for inv in quarter_invoices)
        total = sum(inv["total"] for inv in quarter_invoices)

        return {
            "year": year,
            "quarter": quarter,
            "period": f"Q{quarter} {year} ({start_month:02d}-{end_month:02d})",
            "invoices_count": len(quarter_invoices),
            "total_base_imponible": round(total_base, 2),
            "total_iva_repercutido": round(total_vat, 2),
            "total_facturado": round(total, 2),
            "modelo_303_cuota": round(total_vat, 2),  # Simplificado
        }

    def export_csv(self, year: int = None) -> str:
        """Exporta facturas a CSV para contabilidad."""
        year = year or datetime.now().year
        lines = ["Numero;Fecha;Cliente;NIF;Base;IVA%;IVA;Total;MetodoPago"]

        for inv in self._invoices:
            inv_date = datetime.fromisoformat(inv["date"])
            if inv_date.year == year:
                lines.append(
                    f"{inv['invoice_number']};"
                    f"{inv_date.strftime('%d/%m/%Y')};"
                    f"{inv['customer'].get('name', '')};"
                    f"{inv['customer'].get('vat_id', '')};"
                    f"{inv['subtotal']:.2f};"
                    f"{inv['vat_rate']:.0f};"
                    f"{inv['vat_amount']:.2f};"
                    f"{inv['total']:.2f};"
                    f"{inv['payment_method']}"
                )

        csv_path = os.path.join(BILLING_DIR, f"facturas_{year}.csv")
        with open(csv_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))

        return csv_path

    def get_plans(self) -> dict:
        """Devuelve planes disponibles con precios."""
        return self._config["plans"]

    def update_company_info(self, **kwargs):
        """Actualiza datos de la empresa."""
        for key, value in kwargs.items():
            if key in self._config["company"]:
                self._config["company"][key] = value
        self._save_config()


# Singleton
_billing: Optional[BillingManager] = None


def get_billing() -> BillingManager:
    global _billing
    if _billing is None:
        _billing = BillingManager()
    return _billing
