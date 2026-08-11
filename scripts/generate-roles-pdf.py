#!/usr/bin/env python3
"""Genera el PDF de explicación de GymFlow y alcance por roles (con logo)."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
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
OUT = ROOT / "GymFlow — Roles y alcance del sistema.pdf"
LOGO = ROOT / "public" / "brand" / "gymflow-logo.png"

INK = colors.HexColor("#14231a")
MUTED = colors.HexColor("#5c5c5c")
ACCENT = colors.HexColor("#c8f542")
LINE = colors.HexColor("#d8d8d0")
SOFT = colors.HexColor("#f4f5ef")
WHITE = colors.white


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_brand": ParagraphStyle(
            "cover_brand",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            textColor=INK,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            textColor=MUTED,
            alignment=TA_CENTER,
            leading=16,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=10,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            textColor=INK,
            spaceBefore=14,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=INK,
            spaceBefore=10,
            spaceAfter=4,
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
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=INK,
            leading=13,
        ),
        "note": ParagraphStyle(
            "note",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8.5,
            textColor=MUTED,
            leading=12,
            spaceBefore=4,
            spaceAfter=8,
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
    }


def bullets(items, st):
    return ListFlowable(
        [ListItem(Paragraph(i, st["bullet"]), leftIndent=12, value="•") for i in items],
        bulletType="bullet",
        start="•",
        leftIndent=8,
        bulletFontName="Helvetica",
        bulletFontSize=9,
        spaceBefore=2,
        spaceAfter=8,
    )


def role_card(title, subtitle, tasks, st, extras=None):
    bits = [
        Paragraph(title, st["h2"]),
        Paragraph(subtitle, st["note"]),
        Paragraph("<b>Tareas / alcance</b>", st["h3"]),
        bullets(tasks, st),
    ]
    if extras:
        bits.append(Paragraph("<b>No corresponde (en el sistema)</b>", st["h3"]))
        bits.append(bullets(extras, st))
    return KeepTogether(bits)


def matrix_table(st):
    headers = [
        "Módulo / acción",
        "Administrador",
        "Recepción / Admin.",
        "Entrenador",
    ]
    rows_raw = [
        ["Ver clientes y fichas", "Sí", "Sí", "Sí"],
        ["Alta / edición / baja de clientes", "Sí", "Sí", "No"],
        ["Asignar plan, nivel, días y sexo", "Sí", "Sí", "No"],
        ["Ver / regenerar QR y PIN del portal", "Sí", "Sí", "Ver QR (no gestión)"],
        ["Registrar y gestionar pagos", "Sí", "Sí", "No"],
        ["Ver planes", "Sí", "Sí", "Sí"],
        ["Editar / desactivar planes", "Sí", "No", "No"],
        ["Empleados y recibos de sueldo", "Sí", "No", "No"],
        ["Contenidos info y avisos", "Sí", "Sí", "No"],
        ["Rutinas y dietas", "Sí", "Sí", "Sí (solo estas)"],
        ["Barrera / control de acceso QR", "Sí", "Sí", "Sí"],
        ["Configuración del gimnasio", "Sí", "No", "No"],
    ]
    data = [[Paragraph(h, st["cell_h"]) for h in headers]]
    for r in rows_raw:
        data.append([Paragraph(c, st["cell"]) for c in r])

    t = Table(data, colWidths=[5.2 * cm, 3.2 * cm, 4.0 * cm, 3.8 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
                ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SOFT]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def logo_size(max_width):
    from PIL import Image as PILImage
    iw, ih = PILImage.open(LOGO).size
    h = max_width * ih / iw
    return max_width, h


def draw_header_logo(canvas, doc):
    """Logo pequeño en páginas interiores."""
    if not LOGO.exists() or doc.page == 1:
        return
    canvas.saveState()
    w, h = logo_size(3.8 * cm)
    x = A4[0] - doc.rightMargin - w
    y = A4[1] - 1.15 * cm - h
    canvas.drawImage(
        str(LOGO),
        x,
        y,
        width=w,
        height=h,
        mask="auto",
        preserveAspectRatio=True,
    )
    canvas.restoreState()


def footer(canvas, doc):
    canvas.saveState()
    draw_header_logo(canvas, doc)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    y = 1.4 * cm
    canvas.line(1.8 * cm, y + 8, A4[0] - 1.8 * cm, y + 8)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.8 * cm, y, "GymFlow — Roles y alcance del sistema")
    canvas.drawRightString(A4[0] - 1.8 * cm, y, f"Página {doc.page}")
    # barra acento portada / interiores
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 0.35 * cm, A4[0], 0.35 * cm, fill=1, stroke=0)
    canvas.restoreState()


def cover_logo():
    if not LOGO.exists():
        return None
    w, h = logo_size(11 * cm)
    img = Image(str(LOGO), width=w, height=h)
    img.hAlign = "CENTER"
    return img


def build():
    if not LOGO.exists():
        raise SystemExit(f"Falta el logo: {LOGO}")

    st = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=2.0 * cm,
        title="GymFlow — Roles y alcance del sistema",
        author="Servi-Net / GymFlow",
    )

    story = []

    # Portada
    story.append(Spacer(1, 1.8 * cm))
    logo = cover_logo()
    if logo:
        story.append(logo)
    story.append(Spacer(1, 0.7 * cm))
    story.append(
        Paragraph(
            "Sistema de gestión de gimnasio<br/>Explicación del sistema · Alcance y tareas por rol",
            st["cover_sub"],
        )
    )
    story.append(Spacer(1, 0.6 * cm))
    story.append(
        Paragraph(
            "Panel staff · Portal del cliente (PWA) · Barrera QR<br/>"
            "https://gym.servi-net.com.ar",
            st["cover_sub"],
        )
    )
    story.append(Spacer(1, 1.6 * cm))
    story.append(
        Paragraph(
            "Documento orientado a dueños y equipo operativo. "
            "Describe qué hace el sistema y qué corresponde a cada perfil de uso: "
            "Administrador, Recepción, Administración y Entrenadores.",
            st["body"],
        )
    )
    story.append(PageBreak())

    # 1. Qué es
    story.append(Paragraph("1. Qué es GymFlow", st["h1"]))
    story.append(
        Paragraph(
            "GymFlow es una plataforma multi-gimnasio (multi-tenant) para administrar socios, "
            "membresías, pagos, personal, contenidos (información, avisos, rutinas y dietas) "
            "y el control de ingreso por QR. Cada comercio opera con sus propios datos, "
            "aislados del resto.",
            st["body"],
        )
    )
    story.append(Paragraph("Componentes principales", st["h2"]))
    story.append(
        bullets(
            [
                "<b>Panel del staff</b> (administración del gimnasio): clientes, planes, pagos, empleados, contenidos, acceso y configuración.",
                "<b>Portal del cliente (PWA)</b> en <b>/mi</b>: ingreso con DNI + PIN, QR de acceso, novedades, rutinas y dietas.",
                "<b>Barrera / validación QR</b>: comprueba si el socio está activo y con membresía al día para habilitar el ingreso.",
                "<b>Comercios</b> (solo plataforma): alta y gestión de gimnasios en la red.",
            ],
            st,
        )
    )
    story.append(Paragraph("Idea de funcionamiento", st["h2"]))
    story.append(
        Paragraph(
            "Administración o recepción dan de alta al socio, asignan plan y perfil de entrenamiento "
            "(nivel, días por semana y sexo) y registran cobranzas. Los entrenadores publican "
            "rutinas y dietas. El cliente ve en el celular solo lo que corresponde a su perfil "
            "y muestra el QR en la entrada.",
            st["body"],
        )
    )

    # 2. Roles
    story.append(Paragraph("2. Roles del sistema", st["h1"]))
    story.append(
        Paragraph(
            "En el sistema existen tres roles de acceso del staff: <b>Administrador</b>, "
            "<b>Empleado</b> y <b>Superadministrador</b> (plataforma). Sobre el empleado, "
            "el <b>cargo</b> (texto libre: Recepción, Administración, Entrenador, etc.) "
            "define el alcance operativo.",
            st["body"],
        )
    )
    story.append(
        Paragraph(
            "Recepción y Administración (empleados <b>no entrenadores</b>) pueden administrar "
            "socios y cobranzas. El cargo <b>Entrenador</b> limita contenidos a rutinas/dietas "
            "y no permite altas de clientes ni pagos.",
            st["note"],
        )
    )

    # 3. Admin
    story.append(
        role_card(
            "3. Administrador",
            "Dueño o responsable del comercio. Acceso completo a la operación del gimnasio "
            "(salvo la administración de otros comercios de la plataforma).",
            [
                "Alta, edición y baja (activar/desactivar) de <b>clientes</b>.",
                "Asignar y cambiar <b>plan</b>, fechas de membresía, <b>nivel</b>, <b>días por semana</b> y <b>sexo</b> (para filtrar rutinas/dietas en la app del socio).",
                "Generar / regenerar <b>QR</b> y <b>PIN</b> del portal del cliente; comunicar el acceso a <b>/mi/{código-del-gym}/login</b>.",
                "Gestionar <b>planes</b> (crear, editar, activar/desactivar) y <b>pagos</b> (registrar, cobrar, anular; extensión de membresía).",
                "Administrar <b>empleados</b>: altas, cargos, usuarios de ingreso al panel y <b>recibos de sueldo</b> (emisión, firma, envío).",
                "Publicar <b>contenidos</b>: información, avisos, rutinas y dietas (generales o a un cliente).",
                "Usar el módulo de <b>acceso / barrera</b> y revisar historial de ingresos en la ficha.",
                "Configurar datos del <b>comercio</b> (razón social, contacto, membrete, etc.).",
            ],
            st,
            extras=[
                "Administrar otros gimnasios de la plataforma (eso es Superadmin).",
            ],
        )
    )

    # 4. Empleados
    story.append(Paragraph("4. Empleados", st["h1"]))
    story.append(
        Paragraph(
            "Todo empleado ingresa al panel con usuario propio, rol <b>Empleado</b> y un "
            "<b>cargo</b> definido por el administrador. Los cargos de recepción y administración "
            "pueden operar socios y cobranzas; el entrenador se centra en rutinas/dietas.",
            st["body"],
        )
    )

    story.append(
        role_card(
            "4.1 Recepción",
            "Puesto de atención al público, altas de socios, cobranzas en caja y control de ingreso. "
            "Empleado con cargo tipificado como Recepción (no entrenador).",
            [
                "<b>Dar de alta clientes/socios</b> y completar ficha (plan, nivel, días, sexo, contacto).",
                "<b>Actualizar datos</b> de socios: edición, activar/desactivar, regenerar QR y PIN del portal.",
                "<b>Realizar cobranzas y registrarlas</b> en el módulo de pagos (efectivo, transferencia u otros medios del gym).",
                "Atender consultas, orientar sobre el portal (/mi) y operar la <b>barrera / validación QR</b>.",
                "Publicar <b>avisos e información</b> cuando corresponda.",
                "Derivar al entrenador lo propio de rutinas y dietas; al administrador, empleados, planes (edición) y configuración.",
            ],
            st,
            extras=[
                "Gestionar empleados / recibos de sueldo, editar o desactivar planes, ni cambiar la configuración del comercio.",
            ],
        )
    )

    story.append(
        role_card(
            "4.2 Empleados administrativos",
            "Apoyo a la gestión del gimnasio. Mismos permisos de sistema que Recepción "
            "(empleado no entrenador): socios, cobranzas y contenidos amplios.",
            [
                "<b>Alta y actualización</b> de clientes/socios, incluyendo plan y perfil de entrenamiento.",
                "<b>Registrar cobranzas</b> y consultar el historial de pagos del socio.",
                "Seguimiento del padrón y estado de membresía; regenerar QR/PIN cuando haga falta.",
                "Comunicación vía <b>contenidos PWA</b> (info, avisos, plantillas) y módulo de <b>acceso</b>.",
                "Coordinar con recepción y entrenadores para mantener perfiles completos (nivel, días, sexo).",
            ],
            st,
            extras=[
                "Empleados/recibos, edición de planes y configuración del comercio (reservado al Administrador).",
            ],
        )
    )

    story.append(
        role_card(
            "4.3 Entrenadores",
            "Empleado cuyo cargo contiene la palabra “Entrenador”. El sistema le limita el "
            "módulo de contenidos a <b>rutinas y dietas</b> y no habilita altas ni cobranzas.",
            [
                "Crear y mantener <b>rutinas</b> y <b>dietas</b> publicadas para el gimnasio (difusión general).",
                "Definir en cada plantilla: <b>nivel</b> (principiante / intermedio / avanzado), "
                "<b>sexo</b> (hombre / mujer / todos), <b>días por semana</b> (2 a 6) y, si aplica, enlace de video.",
                "Consultar fichas de clientes (perfil, membresía, accesos) para orientar el trabajo en piso.",
                "Usar la <b>barrera / acceso</b> si colabora en el ingreso.",
                "Indicar a recepción/administración qué falta en el perfil del socio para que vea las plantillas en la app.",
            ],
            st,
            extras=[
                "Alta o edición de clientes, cobranzas/pagos, info/avisos generales, empleados, planes (edición) y configuración.",
            ],
        )
    )

    story.append(PageBreak())

    # 5. Matriz
    story.append(Paragraph("5. Matriz rápida de permisos", st["h1"]))
    story.append(
        Paragraph(
            "Comparación del panel del staff dentro de un mismo gimnasio. "
            "“Recepción / Admin.” = empleado no entrenador.",
            st["note"],
        )
    )
    story.append(matrix_table(st))
    story.append(Spacer(1, 0.35 * cm))
    story.append(
        Paragraph(
            "Superadministrador: además puede crear y administrar comercios y “entrar como” "
            "cualquier gimnasio para operar con los mismos poderes de administrador en ese tenant.",
            st["note"],
        )
    )

    # 6. Portal cliente
    story.append(Paragraph("6. Portal del cliente (app /mi)", st["h1"]))
    story.append(
        Paragraph(
            "Los socios no usan el panel del staff. Entran a la PWA del gimnasio con el "
            "<b>código del gym (slug)</b>, su <b>DNI</b> y el <b>PIN</b> que les asignaron en recepción o administración.",
            st["body"],
        )
    )
    story.append(
        bullets(
            [
                "<b>Inicio:</b> estado de la membresía y <b>QR de ingreso</b> para la barrera.",
                "<b>Novedades:</b> información y avisos publicados por el gym; pueden marcarse leídos y quitarse (dismiss) cuando corresponde.",
                "<b>Rutinas y dietas:</b> solo las que coinciden con su <b>nivel</b>, <b>días por semana</b> y <b>sexo</b> (o plantillas marcadas para “todos”). Si falta alguno de esos datos en la ficha, la app les pide que lo resuelvan en recepción.",
            ],
            st,
        )
    )

    # 7. Flujos
    story.append(Paragraph("7. Flujos de trabajo habituales", st["h1"]))
    story.append(Paragraph("Alta de un socio", st["h2"]))
    story.append(
        bullets(
            [
                "Administrador, recepción o administración crean el cliente; opcionalmente asignan plan (calcula vencimiento), nivel, días y sexo.",
                "El sistema genera QR y PIN; se puede enviar el acceso al portal por email.",
                "Se entrega al socio cómo entrar a /mi y usar el QR.",
            ],
            st,
        )
    )
    story.append(Paragraph("Cobro y membresía al día", st["h2"]))
    story.append(
        bullets(
            [
                "Administrador, recepción o administración registran el pago (efectivo, transferencia o medios integrados) y, si corresponde, extienden la membresía.",
                "Con membresía vigente y cliente activo, la barrera autoriza el ingreso al validar el QR.",
            ],
            st,
        )
    )
    story.append(Paragraph("Publicar una rutina o dieta", st["h2"]))
    story.append(
        bullets(
            [
                "Entrenador (o admin / recepción) publica la plantilla con nivel, sexo y días.",
                "Quien gestiona socios asegura que el perfil del cliente tenga esos tres datos.",
                "El cliente las ve filtradas en Novedades / Rutinas de su app.",
            ],
            st,
        )
    )
    story.append(Paragraph("Control de acceso", st["h2"]))
    story.append(
        bullets(
            [
                "El socio muestra el QR en recepción o en el lector de barrera.",
                "El sistema valida token, comercio, cliente activo y membresía vigente; registra el intento de acceso.",
            ],
            st,
        )
    )

    # 8. Buenas prácticas
    story.append(Paragraph("8. Buenas prácticas operativas", st["h1"]))
    story.append(
        bullets(
            [
                "Reservar el usuario <b>Administrador</b> a dueños o gerencia; no compartir contraseñas entre puestos.",
                "Usar cargos claros al crear empleados: <b>Recepción</b>, <b>Administración</b>, <b>Entrenador</b> (la palabra “Entrenador” activa el modo de contenidos).",
                "Completar siempre <b>nivel, días y sexo</b> en clientes activos que deban ver rutinas/dietas.",
                "Cobranzas y altas de socios: administrador, recepción o administración; no el entrenador.",
                "Publicar avisos operativos desde recepción/administración; dejar rutinas y dietas a los entrenadores.",
            ],
            st,
        )
    )

    story.append(Spacer(1, 0.6 * cm))
    story.append(
        Paragraph(
            "Documento generado para el equipo de GymFlow · Servi-Net · gym.servi-net.com.ar",
            st["note"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"OK: {OUT}")


if __name__ == "__main__":
    build()
