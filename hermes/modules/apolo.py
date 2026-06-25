# -*- coding: utf-8 -*-
"""
🏦 APOLO — Sistema Contable C8L Agency
Registra TODAS las transacciones para Hacienda (SL futura).
Compatible con Modelo 303 (IVA) y exportacion CSV.
"""

import json
import os
import time
import csv
import io
import logging
from datetime import datetime
from config import DATA_DIR

logger = logging.getLogger("hermes.apolo")

TRANSACTIONS_FILE = os.path.join(DATA_DIR, "transactions.json")
BALANCES_FILE = os.path.join(DATA_DIR, "balances.json")



class Apolo:
    """Sistema contable completo para C8L Agency."""

    def __init__(self):
        self.transactions = self._load(TRANSACTIONS_FILE, [])
        self.balances = self._load(BALANCES_FILE, {})
        self.iva_rate = 0.21  # 21% IVA Espana
        self.irpf_rate = 0.15  # 15% retencion creadores

    def _load(self, filepath, default):
        try:
            if os.path.exists(filepath):
                with open(filepath, "r") as f:
                    return json.load(f)
        except:
            pass
        return default

    def _save_transactions(self):
        with open(TRANSACTIONS_FILE, "w") as f:
            json.dump(self.transactions, f, indent=2)

    def _save_balances(self):
        with open(BALANCES_FILE, "w") as f:
            json.dump(self.balances, f, indent=2)


    def register_transaction(self, data):
        """Registra una transaccion completa."""
        tx = {
            "id": f"TX-{int(time.time())}-{len(self.transactions)+1:04d}",
            "timestamp": time.time(),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "user_id": data.get("user_id", "unknown"),
            "username": data.get("username", "unknown"),
            "type": data.get("type", "purchase"),
            "concept": data.get("concept", ""),
            "section": data.get("section", "tienda"),
            "currency": data.get("currency", "coins"),
            "amount_coins": data.get("amount_coins", 0),
            "amount_eur": data.get("amount_eur", 0.0),
            "iva": 0.0,
            "base_imponible": 0.0,
            "total_con_iva": 0.0,
            "payment_method": data.get("payment_method", "coins"),
            "country": data.get("country", "ES"),
            "status": "completed"
        }

        # Calcular IVA si es en euros
        if tx["amount_eur"] > 0:
            tx["base_imponible"] = round(tx["amount_eur"] / (1 + self.iva_rate), 2)
            tx["iva"] = round(tx["amount_eur"] - tx["base_imponible"], 2)
            tx["total_con_iva"] = tx["amount_eur"]

        self.transactions.append(tx)
        self._save_transactions()

        # Actualizar balance del usuario
        uid = str(tx["user_id"])
        if uid not in self.balances:
            self.balances[uid] = {"coins": 0, "diamonds": 0, "spent_eur": 0.0}
        if tx["type"] == "purchase":
            self.balances[uid]["coins"] += tx["amount_coins"]
            self.balances[uid]["spent_eur"] += tx["amount_eur"]
        elif tx["type"] == "spend":
            self.balances[uid]["coins"] -= tx["amount_coins"]
        self._save_balances()

        logger.info(f"TX registrada: {tx['id']} — {tx['concept']} — {tx['amount_eur']}EUR")
        return tx


    def get_user_balance(self, user_id):
        """Retorna balance de un usuario."""
        uid = str(user_id)
        if uid in self.balances:
            return self.balances[uid]
        return {"coins": 0, "diamonds": 0, "spent_eur": 0.0}

    def get_summary(self):
        """Resumen financiero general."""
        total_eur = sum(t["amount_eur"] for t in self.transactions if t["type"] == "purchase")
        total_iva = sum(t["iva"] for t in self.transactions if t["iva"] > 0)
        total_coins_sold = sum(t["amount_coins"] for t in self.transactions if t["type"] == "purchase")
        total_coins_spent = sum(t["amount_coins"] for t in self.transactions if t["type"] == "spend")
        total_users = len(self.balances)

        # Este mes
        now = time.time()
        month_start = time.time() - (datetime.now().day - 1) * 86400
        month_txs = [t for t in self.transactions if t["timestamp"] >= month_start]
        month_eur = sum(t["amount_eur"] for t in month_txs if t["type"] == "purchase")

        return {
            "total_ingresos_eur": round(total_eur, 2),
            "total_iva_recaudado": round(total_iva, 2),
            "total_coins_vendidos": total_coins_sold,
            "total_coins_gastados": total_coins_spent,
            "coins_en_circulacion": total_coins_sold - total_coins_spent,
            "total_usuarios": total_users,
            "ingresos_este_mes": round(month_eur, 2),
            "total_transacciones": len(self.transactions)
        }

    def get_daily_report(self):
        """Reporte del dia actual."""
        today = datetime.now().strftime("%Y-%m-%d")
        today_txs = [t for t in self.transactions if t["date"].startswith(today)]
        ingresos = sum(t["amount_eur"] for t in today_txs if t["type"] == "purchase")
        ventas = len([t for t in today_txs if t["type"] == "purchase"])

        return (
            f"🏦 *APOLO — Reporte Diario*\n"
            f"📅 {today}\n\n"
            f"💰 Ingresos: €{ingresos:.2f}\n"
            f"🛒 Ventas: {ventas}\n"
            f"📊 Transacciones totales hoy: {len(today_txs)}\n"
        )


    def export_csv_quarter(self, quarter=None, year=None):
        """Exporta transacciones de un trimestre en CSV (para gestor/Hacienda)."""
        now = datetime.now()
        if not year:
            year = now.year
        if not quarter:
            quarter = (now.month - 1) // 3 + 1

        # Meses del trimestre
        month_start = (quarter - 1) * 3 + 1
        month_end = quarter * 3

        filtered = []
        for tx in self.transactions:
            tx_date = datetime.strptime(tx["date"], "%Y-%m-%d %H:%M:%S")
            if tx_date.year == year and month_start <= tx_date.month <= month_end:
                filtered.append(tx)

        # Generar CSV
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow([
            "ID Factura", "Fecha", "Usuario", "Concepto", "Seccion",
            "Base Imponible", "IVA (21%)", "Total EUR", "Coins",
            "Metodo Pago", "Pais", "Estado"
        ])
        for tx in filtered:
            writer.writerow([
                tx["id"], tx["date"], tx["username"], tx["concept"],
                tx["section"], tx["base_imponible"], tx["iva"],
                tx["total_con_iva"], tx["amount_coins"],
                tx["payment_method"], tx["country"], tx["status"]
            ])

        csv_content = output.getvalue()
        filename = f"C8L_Facturas_T{quarter}_{year}.csv"
        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, "w") as f:
            f.write(csv_content)

        logger.info(f"CSV exportado: {filename} ({len(filtered)} transacciones)")
        return filepath, len(filtered)

    def get_tax_summary(self, quarter=None, year=None):
        """Resumen fiscal para Modelo 303 (IVA trimestral)."""
        now = datetime.now()
        if not year:
            year = now.year
        if not quarter:
            quarter = (now.month - 1) // 3 + 1

        month_start = (quarter - 1) * 3 + 1
        month_end = quarter * 3

        ingresos = 0.0
        iva_repercutido = 0.0

        for tx in self.transactions:
            tx_date = datetime.strptime(tx["date"], "%Y-%m-%d %H:%M:%S")
            if tx_date.year == year and month_start <= tx_date.month <= month_end:
                if tx["amount_eur"] > 0:
                    ingresos += tx["base_imponible"]
                    iva_repercutido += tx["iva"]

        return {
            "trimestre": f"T{quarter} {year}",
            "base_imponible_total": round(ingresos, 2),
            "iva_repercutido": round(iva_repercutido, 2),
            "iva_soportado": 0.0,
            "resultado_modelo_303": round(iva_repercutido, 2),
            "nota": "IVA soportado (gastos) se anade manualmente"
        }
