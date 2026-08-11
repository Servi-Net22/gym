#!/usr/bin/env python3
"""Guía de uso GymFlow: explicación clara del funcionamiento (con logo)."""

from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "GymFlow — Guía de uso del sistema.pdf"
LOGO = ROOT / "public" / "brand" / "gymflow-logo.png"

INK = colors.HexColor("#14231a")
MUTED = colors.HexColor("#5a5a5a")
ACCENT = colors.HexColor("#c8f542")
LINE = colors.HexColor("#d8d8d0")
SOFT = colors.HexColor("#f4f5ef")
WHITE = colors.white
CARD = colors.HexColor("#fbfcf7")


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            textColor=INK,
            alignment=TA_CENTER,
            spaceAfter=8,
            leading=22,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=MUTED,
            alignment=TA_CENTER,
            leading=15,
            spaceAfter=5,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            textColor=INK,
            spaceBefore=2,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=INK,
            spaceBefore=12,
            spaceAfter=5,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            textColor=INK,
            spaceBefore=8,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=13.5,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        "lead": ParagraphStyle(
            "lead",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=INK,
            leading=14,
            alignment=TA_LEFT,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=13,
        ),
        "step": ParagraphStyle(
            "step",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=13.2,
        ),
        "tip": ParagraphStyle(
            "tip",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=MUTED,
            leading=12.5,
            spaceBefore=2,
            spaceAfter=8,
            leftIndent=4,
            rightIndent=4,
        ),
        "card_title": ParagraphStyle(
            "card_title",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            textColor=INK,
            spaceAfter=3,
        ),
        "card_body": ParagraphStyle(
            "card_body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            textColor=INK,
            leading=12.5,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=INK,
            leading=11,
        ),
        "cell_h": ParagraphStyle(
            "cell_h",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            textColor=INK,
            leading=11,
        ),
        "who": ParagraphStyle(
            "who",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=INK,
            alignment=TA_CENTER,
        ),
    }


def bullets(items, st):
    return ListFlowable(
        [ListItem(Paragraph(i, st["bullet"]), leftIndent=10, value="•") for i in items],
        bulletType="bullet",
        start="•",
        leftIndent=6,
        bulletFontName="Helvetica",
        bulletFontSize=9,
        spaceBefore=1,
        spaceAfter=6,
    )


def numbered(items, st):
    flow = []
    for i, text in enumerate(items, 1):
        flow.append(
            Paragraph(f"<b>{i}.</b>  {text}", st["step"])
        )
        flow.append(Spacer(1, 0.12 * cm))
    return KeepTogether(flow)


def tip_box(text, st):
    inner = Paragraph(f"<b>Tip:</b> {text}", st["tip"])
    t = Table([[inner]], colWidths=[16.6 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.6, ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def info_cards(st):
    cards = [
        (
            "Panel del gimnasio",
            "Lo usan el administrador y el personal. Ahí se cargan socios, cobros, planes, empleados, contenidos y la barrera.",
        ),
        (
            "App del socio (/mi)",
            "El cliente entra con el código del gym, su DNI y un PIN. Ve su QR, novedades, rutinas y dietas.",
        ),
        (
            "Barrera / ingreso",
            "El QR del celular se valida: si la membresía está al día y el socio activo, puede entrar.",
        ),
    ]
    row = [
        Paragraph(f"<b>{title}</b><br/>{body}", st["card_body"])
        for title, body in cards
    ]
    t = Table([row], colWidths=[5.5 * cm, 5.5 * cm, 5.5 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CARD),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def who_table(st):
    headers = ["Qué necesita hacer", "Quién lo hace"]
    rows = [
        ["Dar de alta o editar un socio", "Administrador, Recepción o Administración"],
        ["Cobrar y registrar un pago", "Administrador, Recepción o Administración"],
        ["Regenerar QR o PIN del portal", "Administrador, Recepción o Administración"],
        ["Crear / editar planes del gym", "Solo Administrador"],
        ["Alta de empleados y recibos de sueldo", "Solo Administrador"],
        ["Publicar avisos e información", "Administrador, Recepción o Administración"],
        ["Publicar rutinas y dietas", "Entrenador (también Admin / Recepción)"],
        ["Configurar datos del comercio", "Solo Administrador"],
        ["Validar ingreso (barrera / QR)", "Cualquier usuario del panel"],
    ]
    data = [[Paragraph(h, st["cell_h"]) for h in headers]]
    for a, b in rows:
        data.append([Paragraph(a, st["cell"]), Paragraph(b, st["cell"])])
    t = Table(data, colWidths=[8.2 * cm, 8.4 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SOFT]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def logo_size(max_width):
    iw, ih = PILImage.open(LOGO).size
    return max_width, max_width * ih / iw


def draw_header_logo(canvas, doc):
    if not LOGO.exists() or doc.page == 1:
        return
    canvas.saveState()
    w, h = logo_size(3.6 * cm)
    x = A4[0] - doc.rightMargin - w
    y = A4[1] - 1.15 * cm - h
    canvas.drawImage(str(LOGO), x, y, width=w, height=h, mask="auto", preserveAspectRatio=True)
    canvas.restoreState()


def page_chrome(canvas, doc):
    canvas.saveState()
    draw_header_logo(canvas, doc)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 0.32 * cm, A4[0], 0.32 * cm, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    y = 1.35 * cm
    canvas.line(1.8 * cm, y + 8, A4[0] - 1.8 * cm, y + 8)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.8 * cm, y, "GymFlow — Guía de uso del sistema")
    canvas.drawRightString(A4[0] - 1.8 * cm, y, f"Página {doc.page}")
    canvas.restoreState()


def cover_logo():
    w, h = logo_size(10.5 * cm)
    img = Image(str(LOGO), width=w, height=h)
    img.hAlign = "CENTER"
    return img


def cred_table(headers, rows, st, widths):
    data = [[Paragraph(h, st["cell_h"]) for h in headers]]
    for row in rows:
        data.append([Paragraph(c, st["cell"]) for c in row])
    t = Table(data, colWidths=widths)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SOFT]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def build():
    if not LOGO.exists():
        raise SystemExit(f"Falta el logo: {LOGO}")

    st = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.9 * cm,
        bottomMargin=2.0 * cm,
        title="GymFlow — Guía de uso del sistema",
        author="Servi-Net / GymFlow",
    )

    story = []

    # —— Portada ——
    story.append(Spacer(1, 1.8 * cm))
    story.append(cover_logo())
    story.append(Spacer(1, 0.7 * cm))
    story.append(Paragraph("Guía de uso del sistema", st["cover_title"]))
    story.append(
        Paragraph(
            "Explicación simple del funcionamiento<br/>"
            "Para administradores y el equipo que opera el gimnasio",
            st["cover_sub"],
        )
    )
    story.append(Spacer(1, 0.4 * cm))
    story.append(
        Paragraph(
            "https://gym.servi-net.com.ar",
            st["cover_sub"],
        )
    )
    story.append(Spacer(1, 1.4 * cm))
    story.append(
        Paragraph(
            "Este documento explica, en lenguaje cotidiano, cómo funciona GymFlow: "
            "cómo se carga un socio, cómo se cobra, cómo entra con el QR y cómo ve "
            "rutinas o dietas en el celular. Está pensado para quien administra el "
            "comercio y para recepción, administración y entrenadores.",
            st["lead"],
        )
    )
    story.append(PageBreak())

    # —— 1. En una frase ——
    story.append(Paragraph("1. ¿Qué es GymFlow?", st["h1"]))
    story.append(
        Paragraph(
            "GymFlow es el sistema del gimnasio para <b>gestionar socios</b>, "
            "<b>cobrar membresías</b>, <b>controlar el ingreso con QR</b> y "
            "<b>enviar información, rutinas y dietas</b> a la app del cliente.",
            st["lead"],
        )
    )
    story.append(Paragraph("Tres piezas que van juntas", st["h2"]))
    story.append(info_cards(st))
    story.append(Spacer(1, 0.35 * cm))
    story.append(
        tip_box(
            "Cada gimnasio tiene sus propios datos. No se mezclan con otros comercios. "
            "El “código del gym” (slug) identifica al tuyo en la app del socio, por ejemplo "
            "/mi/gymflow/login.",
            st,
        )
    )

    # —— 2. Quién hace qué ——
    story.append(Paragraph("2. Quién hace qué (resumen)", st["h1"]))
    story.append(
        Paragraph(
            "En el panel hay un <b>Administrador</b> (dueño o responsable) y "
            "<b>Empleados</b> con un cargo: Recepción, Administración, Entrenador, etc. "
            "El cargo importa: recepción y administración pueden manejar socios y cobros; "
            "el entrenador se enfoca en rutinas y dietas.",
            st["body"],
        )
    )
    story.append(who_table(st))
    story.append(Spacer(1, 0.25 * cm))
    story.append(
        tip_box(
            "Al crear un empleado, escribí el cargo con claridad. Si el cargo contiene la "
            "palabra “Entrenador”, el sistema le limita el menú a rutinas y dietas.",
            st,
        )
    )

    # —— 3. Flujo del día a día ——
    story.append(Paragraph("3. Cómo funciona el día a día", st["h1"]))

    story.append(Paragraph("A) Dar de alta un socio", st["h2"]))
    story.append(
        numbered(
            [
                "Entrá a <b>Clientes → Nuevo cliente</b>.",
                "Completá nombre, DNI, contacto y, si corresponde, el <b>plan</b>.",
                "Asigná <b>nivel</b>, <b>días por semana</b> y <b>sexo</b> (sirven para que vea las rutinas/dietas correctas).",
                "Guardá: el sistema genera un <b>QR</b> y un <b>PIN</b> para la app.",
                "Mostrale al socio cómo entrar: código del gym + DNI + PIN.",
            ],
            st,
        )
    )
    story.append(
        tip_box(
            "Si falta nivel, días o sexo, el socio no va a ver rutinas ni dietas en el celular. "
            "Se lo puede completar después editando la ficha.",
            st,
        )
    )

    story.append(Paragraph("B) Cobrar y dejar la membresía al día", st["h2"]))
    story.append(
        numbered(
            [
                "Desde la ficha del cliente tocá <b>Cobrar / registrar pago</b>, o andá a <b>Pagos → Nuevo cobro</b>.",
                "Indicá monto, medio (efectivo, transferencia, etc.) y período.",
                "Si corresponde, marcá extender la membresía: así se actualiza la fecha de vencimiento.",
                "Confirmá. El ingreso por QR solo abre si el socio está <b>activo</b> y con membresía vigente.",
            ],
            st,
        )
    )

    story.append(Paragraph("C) Ingreso a la sala (QR)", st["h2"]))
    story.append(
        numbered(
            [
                "El socio abre la app (/mi), inicia sesión y muestra su <b>QR</b>.",
                "En recepción o en la barrera se valida el código.",
                "Si está al día → puede entrar. Si no → el sistema lo rechaza y queda registrado el intento.",
            ],
            st,
        )
    )

    story.append(Paragraph("D) Rutinas y dietas", st["h2"]))
    story.append(
        numbered(
            [
                "El <b>entrenador</b> (u otro usuario autorizado) publica una rutina o dieta con nivel, sexo y días por semana.",
                "En la ficha del socio deben coincidir esos datos (o la plantilla puede decir sexo “todos”).",
                "El socio las ve filtradas en <b>Novedades / Rutinas</b> de su celular.",
            ],
            st,
        )
    )

    story.append(PageBreak())

    # —— 4. Perfiles ——
    story.append(Paragraph("4. Perfiles de uso (en simple)", st["h1"]))

    story.append(Paragraph("Administrador", st["h2"]))
    story.append(
        Paragraph(
            "Es quien tiene el control completo del gimnasio en GymFlow.",
            st["body"],
        )
    )
    story.append(
        bullets(
            [
                "Todo lo de socios y pagos, más <b>planes</b>, <b>empleados</b>, <b>recibos de sueldo</b> y <b>configuración</b> del comercio.",
                "Puede publicar cualquier tipo de contenido (avisos, info, rutinas, dietas).",
                "Define los usuarios del equipo y sus cargos.",
            ],
            st,
        )
    )

    story.append(Paragraph("Recepción", st["h2"]))
    story.append(
        Paragraph(
            "Atención al público, caja y control de ingreso.",
            st["body"],
        )
    )
    story.append(
        bullets(
            [
                "<b>Alta y edición</b> de socios, QR, PIN y perfil (nivel, días, sexo).",
                "<b>Cobranzas</b>: registrar pagos y consultar historial.",
                "Barrera / validación QR y avisos para la app.",
                "No gestiona empleados, recibos de sueldo ni la configuración del comercio.",
            ],
            st,
        )
    )

    story.append(Paragraph("Administración (empleados administrativos)", st["h2"]))
    story.append(
        Paragraph(
            "Mismos permisos que recepción en el sistema: socios, cobros y contenidos. "
            "En la práctica suele enfocarse en el seguimiento del padrón y el apoyo interno.",
            st["body"],
        )
    )

    story.append(Paragraph("Entrenador", st["h2"]))
    story.append(
        Paragraph(
            "Se centra en el contenido de entrenamiento.",
            st["body"],
        )
    )
    story.append(
        bullets(
            [
                "Crea y publica <b>rutinas</b> y <b>dietas</b> (con nivel, sexo y días).",
                "Puede consultar fichas y usar la barrera.",
                "<b>No</b> da de alta socios ni registra cobros.",
            ],
            st,
        )
    )

    # —— 5. App del cliente ——
    story.append(Paragraph("5. La app del socio (/mi)", st["h1"]))
    story.append(
        Paragraph(
            "No es el panel del staff. Es la aplicación del cliente.",
            st["body"],
        )
    )
    story.append(
        bullets(
            [
                "<b>Ingreso:</b> código del gym + DNI + PIN.",
                "<b>Inicio:</b> ve si está al día y muestra el QR para entrar.",
                "<b>Novedades:</b> avisos e información del gym.",
                "<b>Rutinas y dietas:</b> solo las que coinciden con su perfil.",
            ],
            st,
        )
    )
    story.append(
        tip_box(
            "Si un socio dice “no me aparecen las rutinas”, revisá en su ficha: nivel, días por semana y sexo. "
            "Sin esos tres datos, la app no muestra plantillas.",
            st,
        )
    )

    # —— 6. Menú del panel ——
    story.append(Paragraph("6. Menú del panel (para orientarse)", st["h1"]))
    story.append(
        bullets(
            [
                "<b>Panel:</b> resumen del día (socios, vencimientos, accesos).",
                "<b>Clientes:</b> padrón, fichas, alta/edición, QR y PIN.",
                "<b>Pagos:</b> cobranzas y consultas (visible para admin, recepción y administración).",
                "<b>Planes:</b> todos pueden verlos; crear/editar/desactivar es del administrador.",
                "<b>Empleados:</b> solo administrador (usuarios, cargos, recibos).",
                "<b>Contenidos / Rutinas y dietas:</b> según el cargo.",
                "<b>Acceso / Barrera:</b> probar o validar ingresos.",
                "<b>Configuración:</b> datos del comercio (solo administrador).",
            ],
            st,
        )
    )

    # —— 7. Accesos de prueba ——
    story.append(Paragraph("7. Accesos de prueba (demo)", st["h1"]))
    story.append(
        Paragraph(
            "Los datos de esta sección son <b>de prueba</b>, para probar el funcionamiento "
            "del sistema. <b>No son datos reales</b>. Más adelante se cargarán los datos reales "
            "del gimnasio.",
            st["lead"],
        )
    )
    story.append(
        tip_box(
            "Usá estos usuarios solo para capacitación y pruebas. Cuando el gym entre en "
            "producción, cambiá claves, PINs y reemplazá el padrón demo.",
            st,
        )
    )

    story.append(Paragraph("Panel del staff", st["h2"]))
    story.append(
        Paragraph(
            "Sitio: <b>https://gym.servi-net.com.ar/</b> (login del personal)",
            st["body"],
        )
    )
    story.append(
        cred_table(
            ["Perfil", "Usuario", "Clave", "Cargo"],
            [
                ["Administrador", "admin@gymflow.local", "admin123", "—"],
                ["Empleado", "sofia@gymflow.local", "empleado123", "Recepción"],
                ["Empleado", "diego@gymflow.local", "empleado123", "Entrenador"],
                [
                    "Empleado",
                    "julian@servi-net.com.ar",
                    "empleado123",
                    "Administración",
                ],
            ],
            st,
            [3.2 * cm, 5.4 * cm, 3.2 * cm, 4.8 * cm],
        )
    )

    story.append(Paragraph("App del socio (PWA)", st["h2"]))
    story.append(
        Paragraph(
            "Sitio: <b>https://gym.servi-net.com.ar/mi/gymflow/login</b><br/>"
            "Código del gym de demo: <b>gymflow</b>",
            st["body"],
        )
    )
    story.append(
        cred_table(
            ["Socio", "DNI", "PIN"],
            [
                ["Fernández, Lucía", "30111222", "9976"],
                ["Gómez, Martín", "28999000", "8522"],
                ["Ruiz, Ana", "33444555", "8758"],
            ],
            st,
            [7.0 * cm, 4.8 * cm, 4.8 * cm],
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(
        tip_box(
            "En la app del socio se ingresa DNI + PIN (no email). Si regenerás el PIN desde "
            "la ficha del cliente, el valor de esta tabla deja de valer: usá el PIN nuevo que "
            "muestra el sistema.",
            st,
        )
    )

    # —— 8. Checklist ——
    story.append(Paragraph("8. Checklist rápido al empezar", st["h1"]))
    story.append(
        numbered(
            [
                "Entrá al panel con un usuario de prueba (sección 7) en https://gym.servi-net.com.ar/login.",
                "Probá recepción (Sofía), administración (Julián) y entrenador (Diego) para ver qué puede cada uno.",
                "Entrá a la app del socio con Lucía (DNI 30111222 / PIN 9976) en /mi/gymflow/login.",
                "Revisá QR, novedades y rutinas/dietas según el perfil del socio.",
                "Cuando pases a datos reales: cargá planes, empleados y socios del gym; cambiá claves y PINs demo.",
            ],
            st,
        )
    )

    story.append(Spacer(1, 0.5 * cm))
    story.append(
        Paragraph(
            "GymFlow · Servi-Net · https://gym.servi-net.com.ar",
            st["tip"],
        )
    )

    doc.build(story, onFirstPage=page_chrome, onLaterPages=page_chrome)
    print(f"OK: {OUT}")


if __name__ == "__main__":
    build()
