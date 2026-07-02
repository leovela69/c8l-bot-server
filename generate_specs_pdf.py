#!/usr/bin/env python3
import os
import sys

# Auto-install reportlab if not present
try:
    import reportlab
except ImportError:
    print("ReportLab library not found. Installing now...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    import reportlab

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Custom canvas that performs two passes to calculate the total page count
    and draw professional headers and footers on all pages except the cover page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        
        # Cover Page (Page 1) - Draw minimalist background decorations only
        if self._pageNumber == 1:
            self.setFillColor(colors.HexColor("#0f0f15"))
            self.rect(0, 0, 612, 792, fill=True, stroke=False)
            
            # Draw cyberpunk red line indicator
            self.setStrokeColor(colors.HexColor("#FF0055"))
            self.setLineWidth(4)
            self.line(0, 30, 612, 30)
            
            self.setStrokeColor(colors.HexColor("#00FFCC"))
            self.setLineWidth(2)
            self.line(0, 24, 612, 24)
            self.restoreState()
            return

        # Professional Header on Page 2+
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#E2E8F0")) # Light gray on dark background
        
        # Draw dark slate theme background for the entire document pages
        self.setFillColor(colors.HexColor("#05050A"))
        self.rect(0, 0, 612, 792, fill=True, stroke=False)
        
        # Draw header text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#94A3B8"))
        self.drawString(54, 750, "C.8.L. AGENCY  //  ESPECIFICACIONES DE ARQUITECTURA DE COMUNIDAD")
        
        # Header separator line
        self.setStrokeColor(colors.HexColor("#1E293B"))
        self.setLineWidth(0.75)
        self.line(54, 742, 558, 742)
        
        # Footer text & page numbering
        self.drawString(54, 40, "CONFIDENCIAL  -  USO INTERNO")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(558, 40, page_str)
        
        # Footer separator line
        self.line(54, 52, 558, 52)
        self.restoreState()


def build_pdf(filename="Especificaciones_Comunidad_C8L.pdf"):
    # Target 0.75 inch margins (54 points)
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom Cyberpunk Theme Typography styles
    # High contrast colors suited for print/screen reading
    color_neon_pink = colors.HexColor("#FF0055")
    color_neon_cyan = colors.HexColor("#00FFCC")
    color_slate_light = colors.HexColor("#F8FAFC")
    color_slate_muted = colors.HexColor("#94A3B8")
    
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=color_neon_pink,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=color_neon_cyan,
        spaceAfter=40
    )
    
    meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=14,
        textColor=color_slate_muted,
        spaceAfter=5
    )

    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=color_neon_pink,
        spaceBefore=15,
        spaceAfter=15,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SubSectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=color_neon_cyan,
        spaceBefore=10,
        spaceAfter=8,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=color_slate_light,
        spaceAfter=10
    )

    code_style = ParagraphStyle(
        'CodeStyleCustom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=color_neon_cyan,
        spaceBefore=5,
        spaceAfter=5
    )

    story = []

    # ==================== PAGE 1: COVER PAGE ====================
    story.append(Spacer(1, 120))
    story.append(Paragraph("C.8.L. AGENCY", ParagraphStyle('SubTitleBrand', fontName='Helvetica-Bold', fontSize=14, leading=16, textColor=color_slate_muted, spaceAfter=8)))
    story.append(Paragraph("ECOSISTEMA DE COMUNIDAD<br/>FUSIÓN CREATIVA", title_style))
    story.append(Paragraph("Documento de Especificaciones Técnicas, UI/UX y Algoritmo de Ranking Ponderado", subtitle_style))
    
    story.append(Spacer(1, 180))
    
    story.append(Paragraph("DOCUMENTO DE INGENIERÍA Y DISEÑO DE SISTEMAS", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10, leading=12, textColor=color_neon_cyan, spaceAfter=15)))
    story.append(Paragraph("<b>Autor:</b> Antigravity AI & Architecture Team", meta_style))
    story.append(Paragraph("<b>Estado:</b> Aprobado / Implementado", meta_style))
    story.append(Paragraph("<b>Versión:</b> 1.1 (Estable Bilingüe)", meta_style))
    story.append(Paragraph("<b>Fecha:</b> Mayo 2026", meta_style))
    
    story.append(PageBreak())

    # ==================== PAGE 2: CONCEPTO Y UI/UX ====================
    story.append(Paragraph("1. Concepto Funcional y UI/UX", h1_style))
    story.append(Paragraph(
        "El módulo de comunidad de <i>c.8.l. agency</i> (CorazoneLocos) se define como un entorno "
        "híbrido que fusiona el impacto visual dinámico de un feed de Instagram con la interactividad "
        "en tiempo real de streaming de YouTube, todo envuelto bajo una atmósfera marcadamente hacker y cyberpunk.",
        body_style
    ))
    
    story.append(Paragraph("1.1. Entorno de Doble Chat (Dual-Mode Canvas)", h2_style))
    story.append(Paragraph(
        "Para responder a las necesidades de crítica abierta y networking profesional, el canvas de visualización "
        "de video incorpora dos flujos de mensajería aislados a nivel de interfaz y base de datos:",
        body_style
    ))

    # Features list in table format
    features_data = [
        [
            Paragraph("<b>Pestaña / Canal</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', textColor=color_neon_cyan, fontSize=10)),
            Paragraph("<b>Identidad</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', textColor=color_neon_cyan, fontSize=10)),
            Paragraph("<b>Funcionalidad y Medios</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', textColor=color_neon_cyan, fontSize=10))
        ],
        [
            Paragraph("<b>Chat Abierto<br/>(Modo Perfil)</b>", body_style),
            Paragraph("Perfil real del usuario vinculado a su UID de Firebase Auth. Nombres, avatares y roles visibles (VIP, Artista, Admin).", body_style),
            Paragraph("Mensajería multimedia rica. Permite texto, carga de GIFs y simulación de clips de vídeo cortos para networking y autopromoción.", body_style)
        ],
        [
            Paragraph("<b>Chat Anónimo<br/>(Modo Hacker)</b>", body_style),
            Paragraph("Identidades 100% ocultas. Alias temporales criptográficos autogenerados y máscaras genéricas.", body_style),
            Paragraph("Texto plano y una biblioteca estricta de emojis hacktivistas (🎭, 💀, 💾, 💻, etc.). Bloquea adjuntos multimedia externos.", body_style)
        ]
    ]

    t_features = Table(features_data, colWidths=[1.5*inch, 2.2*inch, 2.8*inch])
    t_features.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E1B29")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#334155")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_features)
    story.append(Spacer(1, 15))

    story.append(Paragraph("1.2. Módulo de Video y Audio Visualizer", h2_style))
    story.append(Paragraph(
        "El reproductor central de streaming soporta reproducción fluida en alta calidad. Si la creación es "
        "únicamente de audio, la interfaz dibuja automáticamente un ecualizador dinámico interactivo "
        "con barras reactivas y colores degradados cian-magenta, manteniendo viva la respuesta visual del usuario.",
        body_style
    ))
    
    story.append(PageBreak())

    # ==================== PAGE 3: ARQUITECTURA DE BASE DE DATOS ====================
    story.append(Paragraph("2. Arquitectura de Base de Datos y Anonimato", h1_style))
    story.append(Paragraph(
        "La gestión de la concurrencia en ambos chats y la garantía de privacidad sin fisuras requiere de "
        "una arquitectura de datos que evite cualquier cruce accidental de identidades.",
        body_style
    ))

    story.append(Paragraph("2.1. Modelo de Datos para Usuarios Duplicados", h2_style))
    story.append(Paragraph(
        "Un mismo usuario autenticado puede participar en ambas salas a la vez. En el backend, esto se resuelve "
        "mediante la disociación criptográfica del id del mensaje en la base de datos:",
        body_style
    ))

    # Code representation of anonymous session generation
    crypto_ex = (
        "// Generación de Sesión Anónima Temporal en Node.js/TypeScript\n"
        "import { createHmac } from 'crypto';\n\n"
        "function generateAnonymousSessionId(userId: string, trackId: string, dailySalt: string): string {\n"
        "  // El dailySalt rota cada 24h y no se almacena en logs permanentes\n"
        "  return createHmac('sha256', dailySalt)\n"
        "    .update(userId + '_' + trackId)\n"
        "    .digest('hex');\n"
        "}"
    )
    story.append(Table([[Paragraph(f"<pre>{crypto_ex}</pre>", code_style)]], 
                       colWidths=[6.5*inch], 
                       style=[
                           ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0D0E15")),
                           ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#1E293B")),
                           ('PADDING', (0,0), (-1,-1), 10)
                       ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.2. Estructura de Colecciones de Firestore", h2_style))
    
    # Firestore schema table
    schema_data = [
        [
            Paragraph("<b>Colección</b>", ParagraphStyle('TH2', fontName='Helvetica-Bold', textColor=color_neon_cyan, fontSize=9)),
            Paragraph("<b>Campos Clave</b>", ParagraphStyle('TH2', fontName='Helvetica-Bold', textColor=color_neon_cyan, fontSize=9)),
            Paragraph("<b>Estrategia de Privacidad</b>", ParagraphStyle('TH2', fontName='Helvetica-Bold', textColor=color_neon_cyan, fontSize=9))
        ],
        [
            Paragraph("<b>users</b>", body_style),
            Paragraph("uid, email, name, platform, coins, subscription", body_style),
            Paragraph("Acceso seguro, requiere reglas de escritura del propio usuario.", body_style)
        ],
        [
            Paragraph("<b>tracks</b>", body_style),
            Paragraph("id, title, creator, likes, shares, gifts, tokens, score", body_style),
            Paragraph("Campos numéricos expuestos para la lectura pública y leaderboard.", body_style)
        ],
        [
            Paragraph("<b>public_messages</b>", body_style),
            Paragraph("id, track_id, user_id, userName, avatar, content, timestamp", body_style),
            Paragraph("Vinculación directa. Muestra la identidad real del usuario.", body_style)
        ],
        [
            Paragraph("<b>anonymous_messages</b>", body_style),
            Paragraph("id, track_id, anonymous_session_id, alias, content, timestamp", body_style),
            Paragraph("<b>Ningún campo vincula al user_id.</b> Cifrado por HMAC. Imposible cruzar datos.", body_style)
        ]
    ]

    t_schema = Table(schema_data, colWidths=[1.4*inch, 2.6*inch, 2.5*inch])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E1B29")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#334155")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_schema)

    story.append(PageBreak())

    # ==================== PAGE 4: ALGORITMO Y JERARQUIA ====================
    story.append(Paragraph("3. Algoritmo de Ranking y Estructura de Interfaz", h1_style))
    
    story.append(Paragraph("3.1. Lógica del Algoritmo Ponderado", h2_style))
    story.append(Paragraph(
        "El Leaderboard competitivo evalúa el éxito y tracción de los temas creados mediante la fórmula matemática:",
        body_style
    ))

    # Formula card display
    formula_text = "<b>Score = (Tokens * w1) + (Gifts * w2) + (Likes * w3) + (Shares * w4)</b>"
    story.append(Table([[Paragraph(formula_text, ParagraphStyle('Form', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor("#eab308"), alignment=1))]], 
                       colWidths=[6.5*inch], 
                       style=[
                           ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A120B")),
                           ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#FFCC00")),
                           ('PADDING', (0,0), (-1,-1), 12)
                       ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Pesos de calibración por defecto:<br/>"
        "• <b>Tokens (w1) = 2.0</b>: Interacción de alto valor dentro del ecosistema.<br/>"
        "• <b>Gifts (w2) = 5.0</b>: Aportaciones directas monetizables, máxima importancia.<br/>"
        "• <b>Likes (w3) = 1.0</b>: Reacción de engagement estándar.<br/>"
        "• <b>Shares (w4) = 3.5</b>: Factor de crecimiento y viralización externa.",
        body_style
    ))

    story.append(Paragraph("3.2. Jerarquía de Componentes Frontend (React / Next.js)", h2_style))
    story.append(Paragraph(
        "La composición de la interfaz asegura que el renderizado del video principal no afecte al flujo "
        "de chats ni a la reactividad de la lista. La estructura de árbol definida es la siguiente:",
        body_style
    ))

    # Visual hierarchy representation in code style block
    hierarchy_str = (
        "CommunityPage (Container principal)\n"
        " ├── Header / Logo CorazoneLocos & Anagramas\n"
        " ├── MainGrid (Layout dividido)\n"
        " │    ├── LeftColumn (Reproducción y Chats)\n"
        " │    │    ├── VideoPlayer / Streaming Canvas (Looping background)\n"
        " │    │    │    └── EqualizerVisualizer (Reactivo en audio)\n"
        " │    │    └── DualChatPanel (Framer Motion tabs)\n"
        " │    │         ├── TabSelector (Public vs Anonymous)\n"
        " │    │         ├── PublicChatContainer (Multimedia + Real profiles)\n"
        " │    │         └── AnonymousChatContainer (Hacker terminal + custom emojis)\n"
        " │    └── RightColumn (Competencia)\n"
        " │         ├── LeaderboardList (Sorting animado mediante keys)\n"
        " │         └── RecargaWallet (Deducción y recarga de Coins)\n"
        " └── VIPRewardsShop (Recompensas)"
    )
    
    story.append(Table([[Paragraph(f"<pre>{hierarchy_str}</pre>", code_style)]], 
                       colWidths=[6.5*inch], 
                       style=[
                           ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0D0E15")),
                           ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#1E293B")),
                           ('PADDING', (0,0), (-1,-1), 10)
                       ]))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    pdf_filename = "Especificaciones_Comunidad_C8L.pdf"
    build_pdf(pdf_filename)
    print(f"Success! Generated professional PDF file at: {os.path.abspath(pdf_filename)}")
