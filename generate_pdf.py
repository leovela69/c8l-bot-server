# -*- coding: utf-8 -*-
"""Genera PDF del estudio C8L Agency para Antigravity."""
import re
from fpdf import FPDF
from fpdf.enums import XPos, YPos


def clean_for_pdf(text):
    """Reemplaza caracteres no-latin1 por equivalentes ASCII."""
    replacements = {
        '\u2014': '-', '\u2013': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"', '\u2026': '...', '\u2192': '->',
        '\u2190': '<-', '\u2022': '*', '\u221e': 'inf', '\u2713': '[x]',
        '\u2717': '[ ]', '\u2500': '-', '\u2502': '|', '\u250c': '+',
        '\u2510': '+', '\u2514': '+', '\u2518': '+', '\u251c': '+',
        '\u2524': '+', '\u252c': '+', '\u2534': '+', '\u253c': '+',
        '\u2550': '=', '\u2551': '|', '\u2554': '+', '\u2557': '+',
        '\u255a': '+', '\u255d': '+',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Remove emojis
    emoji_pattern = re.compile(
        "[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF"
        "\U0001F1E0-\U0001F1FF\U00002702-\U000027B0\U000024C2-\U0001F251"
        "\U0001f926-\U0001f937\U00010000-\U0010ffff\u2640-\u2642\u2600-\u2B55"
        "\u200d\u23cf\u23e9\u231a\ufe0f\u3030]+", flags=re.UNICODE)
    text = emoji_pattern.sub("", text)
    # Final: replace remaining non-latin1
    return ''.join(ch if ord(ch) < 256 else '?' for ch in text)


def generate_c8l_pdf():
    with open("C8L_AGENCY_ESTUDIO_ANTIGRAVITY.md", "r", encoding="utf-8") as f:
        raw = f.read()

    content = clean_for_pdf(raw)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_margins(12, 15, 12)

    # --- PORTADA ---
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 36)
    pdf.ln(40)
    pdf.cell(0, 20, "C8L AGENCY", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.set_font("Helvetica", "", 18)
    pdf.cell(0, 12, "Estudio Completo para Antigravity", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 14)
    pdf.cell(0, 10, "Documento de Referencia para IAs y Colaboradores", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(20)
    pdf.set_font("Helvetica", "", 12)
    info_lines = [
        "Fecha: 24 Junio 2026",
        "Proyecto: C8L Agency - Corazones Locos Family",
        "Creador: Leo Vela (@leovela69)",
        "Bot Telegram: @leon_leo_bot",
        "Repo: github.com/leovela69/c8l-bot-server",
        "Web: c8l-bot-server.vercel.app",
    ]
    for line in info_lines:
        pdf.cell(0, 8, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "v17.0 Panteon Master | 17 secciones | 11 agentes IA", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.cell(0, 8, "10 paginas web | 12 motores video | $0/mes", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

    # --- CONTENIDO ---
    pdf.add_page()
    in_code = False
    code_buf = []

    for line in content.split("\n"):
        line = line.rstrip()

        # Code block toggle
        if line.strip().startswith("```"):
            if in_code:
                in_code = False
                pdf.set_font("Courier", "", 7)
                pdf.set_fill_color(245, 245, 245)
                for cl in code_buf:
                    pdf.cell(0, 3.5, cl[:110], new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
                pdf.ln(2)
                code_buf = []
            else:
                in_code = True
                code_buf = []
            continue

        if in_code:
            code_buf.append(line)
            continue

        # Horizontal rule
        if line.strip() == "---":
            pdf.ln(2)
            pdf.set_draw_color(180, 180, 180)
            pdf.line(12, pdf.get_y(), 198, pdf.get_y())
            pdf.ln(3)
            continue

        # H1
        if line.startswith("# "):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 18)
            pdf.cell(0, 10, line[2:].strip()[:100], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(2)
            continue

        # H2
        if line.startswith("## "):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 14)
            pdf.cell(0, 8, line[3:].strip()[:100], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(1)
            continue

        # H3
        if line.startswith("### "):
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(0, 7, line[4:].strip()[:100], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.ln(1)
            continue

        # Table row
        if line.startswith("|"):
            if line.replace("|", "").replace("-", "").replace(" ", "") == "":
                continue  # Skip separator rows like |---|---|
            pdf.set_font("Courier", "", 6.5)
            pdf.cell(0, 3.5, line[:120], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            continue

        # Bullet point
        if line.startswith("- ") or line.startswith("* "):
            pdf.set_font("Helvetica", "", 9)
            txt = "  * " + line[2:].strip()
            pdf.cell(0, 4.5, txt[:120], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            continue

        # Sub-bullet
        if line.startswith("  - ") or line.startswith("  * "):
            pdf.set_font("Helvetica", "", 8.5)
            txt = "      - " + line[4:].strip()
            pdf.cell(0, 4, txt[:110], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            continue

        # Numbered list
        if re.match(r'^\d+\.', line.strip()):
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(0, 4.5, "  " + line.strip()[:120], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            continue

        # Blockquote
        if line.startswith("> "):
            pdf.set_font("Helvetica", "I", 9)
            pdf.cell(0, 4.5, "  " + line[2:].strip()[:110], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            continue

        # Empty line
        if line.strip() == "":
            pdf.ln(2)
            continue

        # Normal text
        pdf.set_font("Helvetica", "", 9.5)
        clean = line.replace("**", "").replace("*", "").strip()
        if clean:
            # Split long lines into chunks that fit
            while len(clean) > 0:
                pdf.cell(0, 4.5, clean[:100], new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                clean = clean[100:]

    # --- FOOTER ---
    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 6, "Generado por Kiro AI para C8L Agency - 24 Junio 2026", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.cell(0, 6, "github.com/leovela69/c8l-bot-server", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

    out = "C8L_AGENCY_ESTUDIO_ANTIGRAVITY.pdf"
    pdf.output(out)
    print(f"PDF generado exitosamente: {out} ({pdf.page} paginas)")


if __name__ == "__main__":
    generate_c8l_pdf()
