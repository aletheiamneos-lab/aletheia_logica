from __future__ import annotations

import math
import re
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


PAGE_W, PAGE_H = A4
MM = 72 / 25.4
MARGIN = 10 * MM
FOOTER_H = 14 * MM
CONTENT_BOTTOM = FOOTER_H + 8 * MM

TEAL = HexColor("#0B665F")
TEAL_DARK = HexColor("#084D49")
INK = HexColor("#103F3D")
TEXT = HexColor("#10252A")
MUTED = HexColor("#68716F")
LINE = HexColor("#DCE2DF")
GRID = HexColor("#D7DEDB")
SUCCESS = HexColor("#178451")
SUCCESS_BG = HexColor("#F5FBF7")
DANGER = HexColor("#C93D35")
DANGER_BG = HexColor("#FFF8F7")
INCOMPLETE = HexColor("#777777")
INCOMPLETE_BG = HexColor("#FAFAFA")
WHITE = colors.white

CANONICAL_ZONES = ["Definiții", "Clasificare", "Propoziții", "Silogisme", "Erori"]
ZONE_ACCENTS = [
    HexColor("#0B665F"),
    HexColor("#E77716"),
    HexColor("#2C7FC1"),
    HexColor("#7351B6"),
    HexColor("#B81F3A"),
]


def _resolve_fonts() -> tuple[str, str]:
    candidates = [
        (
            Path("C:/Windows/Fonts/georgia.ttf"),
            Path("C:/Windows/Fonts/georgiab.ttf"),
            "LogicaIntegrated-Georgia",
        ),
        (
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"),
            "LogicaIntegrated-DejaVuSerif",
        ),
        (
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
            "LogicaIntegrated-Arial",
        ),
    ]
    for regular_path, bold_path, family in candidates:
        if not regular_path.exists() or not bold_path.exists():
            continue
        regular_name = f"{family}-Regular"
        bold_name = f"{family}-Bold"
        try:
            if regular_name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(regular_name, str(regular_path)))
            if bold_name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(bold_name, str(bold_path)))
            return regular_name, bold_name
        except Exception:
            continue
    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = _resolve_fonts()


def _clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ").replace("\r", " ")).strip()


def _coerce_int(value) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _format_date(value: str | None) -> str:
    if not value:
        return "-"
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return str(value)[:10]
    return parsed.strftime("%Y-%m-%d")


def _format_duration(seconds: int) -> str:
    hours, remainder = divmod(max(_coerce_int(seconds), 0), 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def _performance_label(percentage: int) -> str:
    if percentage <= 20:
        return "Început"
    if percentage <= 50:
        return "În dezvoltare"
    if percentage <= 79:
        return "Satisfăcător"
    if percentage <= 99:
        return "Foarte bine"
    return "Excelent"


def _split_long_word(word: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    chunks = []
    current = ""
    for char in word:
        candidate = current + char
        if current and pdfmetrics.stringWidth(candidate, font_name, font_size) > max_width:
            chunks.append(current)
            current = char
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks or [word]


def _wrap(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    words = _clean(text).split()
    if not words:
        return [""]
    lines: list[str] = []
    current = ""
    for original_word in words:
        word_parts = (
            _split_long_word(original_word, font_name, font_size, max_width)
            if pdfmetrics.stringWidth(original_word, font_name, font_size) > max_width
            else [original_word]
        )
        for word in word_parts:
            candidate = f"{current} {word}".strip()
            if current and pdfmetrics.stringWidth(candidate, font_name, font_size) > max_width:
                lines.append(current)
                current = word
            else:
                current = candidate
    if current:
        lines.append(current)
    return lines


def _draw_lines(
    pdf: canvas.Canvas,
    lines: list[str],
    x: float,
    y: float,
    font_name: str,
    font_size: float,
    leading: float,
    color=TEXT,
) -> float:
    pdf.setFont(font_name, font_size)
    pdf.setFillColor(color)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def _draw_justified(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font_size: float,
    leading: float,
) -> float:
    lines = _wrap(text, FONT_REGULAR, font_size, width)
    pdf.setFont(FONT_REGULAR, font_size)
    pdf.setFillColor(TEXT)
    for index, line in enumerate(lines):
        words = line.split()
        is_last = index == len(lines) - 1
        natural_width = pdfmetrics.stringWidth(line, FONT_REGULAR, font_size)
        extra_per_gap = (width - natural_width) / max(len(words) - 1, 1)
        if is_last or len(words) < 3 or extra_per_gap > 2.8:
            pdf.drawString(x, y, line)
        else:
            text_object = pdf.beginText(x, y)
            text_object.setFont(FONT_REGULAR, font_size)
            text_object.setFillColor(TEXT)
            text_object.setWordSpace(extra_per_gap)
            text_object.textLine(line)
            pdf.drawText(text_object)
        y -= leading
    return y


def _question_status(question: dict) -> tuple[str, colors.Color, colors.Color]:
    if question.get("is_correct"):
        return "CORECT", SUCCESS, SUCCESS_BG
    if question.get("is_answered"):
        return "GREȘIT", DANGER, DANGER_BG
    return "NECOMPLETAT", INCOMPLETE, INCOMPLETE_BG


def _build_zones(questions: list[dict]) -> list[dict]:
    zones = [
        {"label": label, "correct": 0, "total": 0, "percent": 0, "accent": ZONE_ACCENTS[index]}
        for index, label in enumerate(CANONICAL_ZONES)
    ]
    for position, question in enumerate(questions):
        number = _coerce_int(question.get("index")) or position + 1
        zone_index = min(max((number - 1) // 5, 0), 4)
        zones[zone_index]["total"] += 1
        if question.get("is_correct"):
            zones[zone_index]["correct"] += 1
    for zone in zones:
        zone["percent"] = round((zone["correct"] / zone["total"]) * 100) if zone["total"] else 0
    return zones


def _group_questions(questions: list[dict]) -> list[dict]:
    groups = [
        {"code": f"L{index + 1}", "title": label.upper(), "questions": []}
        for index, label in enumerate(CANONICAL_ZONES)
    ]
    for position, question in enumerate(questions):
        number = _coerce_int(question.get("index")) or position + 1
        group_index = min(max((number - 1) // 5, 0), 4)
        groups[group_index]["questions"].append(question)
    return groups


def _draw_header(pdf: canvas.Canvas, compact: bool = False) -> float:
    top_y = PAGE_H - 11 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 19 if compact else 26)
    pdf.drawString(MARGIN, top_y, "Logica")
    pdf.setFont(FONT_REGULAR, 8.5 if compact else 10.5)
    pdf.drawString(MARGIN, top_y - (4.7 if compact else 5.8) * MM, "by A mentor")
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 8.2)
    pdf.drawRightString(PAGE_W - MARGIN, top_y - 0.5 * MM, "TEST INTEGRAT")
    rule_y = top_y - (8.2 if compact else 9.5) * MM
    pdf.setStrokeColor(TEAL_DARK)
    pdf.setLineWidth(0.7)
    pdf.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)
    return rule_y


def _draw_footer(pdf: canvas.Canvas, page_number: int, page_count: int) -> None:
    pdf.setFillColor(TEAL_DARK)
    pdf.rect(0, 0, PAGE_W, FOOTER_H, fill=1, stroke=0)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_BOLD, 9.5)
    pdf.drawString(MARGIN, 5.1 * MM, "A mentor")
    brand_width = pdfmetrics.stringWidth("A mentor", FONT_BOLD, 9.5)
    divider_x = MARGIN + brand_width + 5 * MM
    pdf.setStrokeColor(colors.Color(1, 1, 1, alpha=0.65))
    pdf.setLineWidth(0.5)
    pdf.line(divider_x, 3.4 * MM, divider_x, 10.6 * MM)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_REGULAR, 8.3)
    pdf.drawString(divider_x + 5 * MM, 5.2 * MM, "Excelență prin evaluare")
    pdf.drawRightString(PAGE_W - MARGIN, 5.2 * MM, f"Pagina {page_number} din {page_count}")


def _draw_score_ring(pdf: canvas.Canvas, center_x: float, center_y: float, radius: float, score: int) -> None:
    pdf.setStrokeColor(HexColor("#E5E7E5"))
    pdf.setLineWidth(7.5)
    pdf.circle(center_x, center_y, radius, fill=0, stroke=1)
    if score > 0:
        pdf.setStrokeColor(TEAL)
        pdf.setLineCap(1)
        pdf.arc(
            center_x - radius,
            center_y - radius,
            center_x + radius,
            center_y + radius,
            90,
            -360 * min(max(score, 0), 100) / 100,
        )
        pdf.setLineCap(0)
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 19)
    pdf.drawCentredString(center_x, center_y - 6, f"{score}%")


def _draw_radar(pdf: canvas.Canvas, x: float, y: float, width: float, height: float, zones: list[dict]) -> None:
    center_x = x + width * 0.5
    center_y = y + height * 0.47
    radius = min(width, height) * 0.32

    def point(index: int, scale: float) -> tuple[float, float]:
        angle = math.pi / 2 - (2 * math.pi * index / 5)
        return (
            center_x + radius * scale * math.cos(angle),
            center_y + radius * scale * math.sin(angle),
        )

    pdf.setLineWidth(0.35)
    pdf.setStrokeColor(GRID)
    for level in (0.25, 0.5, 0.75, 1):
        grid_points = [point(index, level) for index in range(5)]
        path = pdf.beginPath()
        path.moveTo(*grid_points[0])
        for grid_point in grid_points[1:]:
            path.lineTo(*grid_point)
        path.close()
        pdf.drawPath(path, stroke=1, fill=0)

    for index in range(5):
        axis_x, axis_y = point(index, 1)
        pdf.line(center_x, center_y, axis_x, axis_y)

    pdf.setFont(FONT_REGULAR, 7.3)
    pdf.setFillColor(TEXT)
    for index, zone in enumerate(zones):
        label_x, label_y = point(index, 1.3)
        pdf.drawCentredString(label_x, label_y - 2, zone["label"])

    pdf.setFillColor(MUTED)
    pdf.setFont(FONT_REGULAR, 5.8)
    pdf.drawString(center_x + 3, center_y - 2, "0%")
    for level in (0.25, 0.5, 0.75, 1):
        level_x, level_y = point(0, level)
        pdf.drawString(level_x + 3, level_y - 2, f"{round(level * 100)}%")

    values = [point(index, max(0, min(100, zone["percent"])) / 100) for index, zone in enumerate(zones)]
    polygon = pdf.beginPath()
    polygon.moveTo(*values[0])
    for value_point in values[1:]:
        polygon.lineTo(*value_point)
    polygon.close()
    pdf.setFillColor(colors.Color(11 / 255, 102 / 255, 95 / 255, alpha=0.24))
    pdf.setStrokeColor(TEAL)
    pdf.setLineWidth(1.7)
    pdf.drawPath(polygon, stroke=1, fill=1)
    pdf.setFillColor(TEAL)
    for value_x, value_y in values:
        pdf.circle(value_x, value_y, 2.2, fill=1, stroke=0)


def _draw_status_pill(
    pdf: canvas.Canvas,
    question: dict,
    right_x: float,
    center_y: float,
    font_size: float = 6.8,
) -> None:
    label, color, background = _question_status(question)
    width = max(44, pdfmetrics.stringWidth(label, FONT_BOLD, font_size) + 14)
    height = 15
    pdf.setFillColor(background)
    pdf.setStrokeColor(color)
    pdf.setLineWidth(0.45)
    pdf.roundRect(right_x - width, center_y - height / 2, width, height, height / 2, fill=1, stroke=1)
    pdf.setFillColor(color)
    pdf.setFont(FONT_BOLD, font_size)
    pdf.drawCentredString(right_x - width / 2, center_y - 2.2, label)


def _draw_summary_page(pdf: canvas.Canvas, report: dict, page_count: int) -> None:
    header_y = _draw_header(pdf)
    questions = report["questions"]
    zones = report["zones"]
    total = len(questions)
    correct = sum(1 for question in questions if question.get("is_correct"))
    percentage = round((correct / total) * 100) if total else 0

    title_y = header_y - 15 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 18)
    pdf.drawCentredString(PAGE_W / 2, title_y, "RAPORT FINALIZARE TEST")
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_REGULAR, 11.5)
    pdf.drawCentredString(PAGE_W / 2, title_y - 7 * MM, report["test_title"])
    ornament_y = title_y - 12 * MM
    pdf.setStrokeColor(TEAL)
    pdf.setLineWidth(0.55)
    pdf.line(PAGE_W / 2 - 14 * MM, ornament_y, PAGE_W / 2 + 14 * MM, ornament_y)
    pdf.setFillColor(TEAL)
    diamond = pdf.beginPath()
    diamond.moveTo(PAGE_W / 2, ornament_y + 3)
    diamond.lineTo(PAGE_W / 2 + 3, ornament_y)
    diamond.lineTo(PAGE_W / 2, ornament_y - 3)
    diamond.lineTo(PAGE_W / 2 - 3, ornament_y)
    diamond.close()
    pdf.drawPath(diamond, fill=1, stroke=0)

    meta_y = ornament_y - 12 * MM
    label_x = MARGIN
    value_x = MARGIN + 34 * MM
    meta_items = [
        ("Nume candidat:", report["student_name"]),
        ("Data susținerii:", report["date"]),
        ("Număr întrebări:", str(total)),
    ]
    for row_index, (label, value) in enumerate(meta_items):
        row_y = meta_y - row_index * 7 * MM
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_BOLD, 8.8)
        pdf.drawString(label_x, row_y, label)
        pdf.setFillColor(INK)
        pdf.setFont(FONT_REGULAR, 8.8)
        pdf.drawString(value_x, row_y, value)

    intro_x = PAGE_W - MARGIN - 76 * MM
    intro_text = (
        "Raportul afișează doar rezultatul elevului. Pentru itemii greșiți apare varianta corectă, "
        "fără explicații sau rezolvare profesor."
    )
    _draw_justified(pdf, intro_text, intro_x, meta_y, 76 * MM, 8.2, 12)

    kpi_top = meta_y - 27 * MM
    kpi_bottom = kpi_top - 34 * MM
    kpi_width = (PAGE_W - 2 * MARGIN) / 4
    for index in range(1, 4):
        divider_x = MARGIN + index * kpi_width
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.55)
        pdf.line(divider_x, kpi_bottom + 3 * MM, divider_x, kpi_top - 3 * MM)

    centers = [MARGIN + (index + 0.5) * kpi_width for index in range(4)]
    _draw_score_ring(pdf, centers[0], (kpi_top + kpi_bottom) / 2 + 4 * MM, 12 * MM, percentage)
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 7.1)
    pdf.drawCentredString(centers[0], kpi_bottom + 2.5 * MM, "SCOR OBȚINUT")

    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 21)
    pdf.drawCentredString(centers[1], (kpi_top + kpi_bottom) / 2 + 2 * MM, f"{correct} / {total}")
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 6.8)
    pdf.drawCentredString(centers[1], kpi_bottom + 4.3 * MM, "RĂSPUNSURI")
    pdf.drawCentredString(centers[1], kpi_bottom + 1.2 * MM, "CORECTE")

    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 13)
    pdf.drawCentredString(centers[2], (kpi_top + kpi_bottom) / 2 + 2 * MM, _performance_label(percentage))
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 7.1)
    pdf.drawCentredString(centers[2], kpi_bottom + 2.5 * MM, "PERFORMANȚĂ")

    clock_center_y = (kpi_top + kpi_bottom) / 2 + 7 * MM
    pdf.setStrokeColor(TEXT)
    pdf.setLineWidth(1.2)
    pdf.circle(centers[3], clock_center_y, 4.2 * MM, fill=0, stroke=1)
    pdf.line(centers[3], clock_center_y, centers[3], clock_center_y + 2.4 * MM)
    pdf.line(centers[3], clock_center_y, centers[3] + 2.1 * MM, clock_center_y - 1.4 * MM)
    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 13.5)
    pdf.drawCentredString(centers[3], clock_center_y - 10 * MM, report["duration"])
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 7.1)
    pdf.drawCentredString(centers[3], kpi_bottom + 2.5 * MM, "TIMP COMPLETARE")

    section_y = kpi_bottom - 8 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 13.5)
    pdf.drawString(MARGIN, section_y, "PERFORMANȚĂ PE ZONE")

    performance_bottom = section_y - 57 * MM
    radar_width = 82 * MM
    _draw_radar(pdf, MARGIN, performance_bottom, radar_width, 53 * MM, zones)

    table_x = MARGIN + 94 * MM
    table_right = PAGE_W - MARGIN
    table_y = section_y - 7 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 7)
    pdf.drawString(table_x, table_y, "ZONĂ")
    pdf.drawRightString(table_right - 19 * MM, table_y, "CORECTE / 5")
    pdf.drawRightString(table_right, table_y, "%")
    table_y -= 7.3 * MM
    for zone_index, zone in enumerate(zones):
        pdf.setFillColor(zone["accent"])
        pdf.circle(table_x + 2.2, table_y + 2.5, 2.4, fill=1, stroke=0)
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_REGULAR, 8.3)
        pdf.drawString(table_x + 8, table_y, zone["label"])
        pdf.drawRightString(table_right - 19 * MM, table_y, f"{zone['correct']} / {zone['total']}")
        pdf.drawRightString(table_right, table_y, f"{zone['percent']}%")
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.35)
        pdf.line(table_x, table_y - 3 * MM, table_right, table_y - 3 * MM)
        table_y -= 8.2 * MM

    review_y = performance_bottom - 4 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 13)
    pdf.drawString(MARGIN, review_y, "REVIZUIREA RĂSPUNSURILOR")
    first_group = report["groups"][0]
    card_top = review_y - 5 * MM
    header_h = 8 * MM
    row_h = 7.4 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.rect(MARGIN, card_top - header_h, PAGE_W - 2 * MARGIN, header_h, fill=1, stroke=0)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_BOLD, 9.3)
    pdf.drawString(MARGIN + 4 * MM, card_top - 5.2 * MM, f"{first_group['code']}. {first_group['title']}")
    row_top = card_top - header_h
    for question in first_group["questions"]:
        row_center = row_top - row_h / 2
        pdf.setFillColor(TEAL_DARK)
        pdf.circle(MARGIN + 6 * MM, row_center, 3 * MM, fill=1, stroke=0)
        pdf.setFillColor(WHITE)
        pdf.setFont(FONT_BOLD, 6.8)
        pdf.drawCentredString(MARGIN + 6 * MM, row_center - 2.2, str(question["index"]))
        text_x = MARGIN + 12 * MM
        status_right = PAGE_W - MARGIN - 6 * MM
        text_width = status_right - text_x - 28 * MM
        question_lines = _wrap(question["question_text"], FONT_REGULAR, 7.2, text_width)[:2]
        start_text_y = row_center + (2.8 if len(question_lines) == 1 else 6)
        _draw_lines(pdf, question_lines, text_x, start_text_y, FONT_REGULAR, 7.2, 8.2, TEXT)
        _draw_status_pill(pdf, question, status_right, row_center, 6.1)
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.35)
        pdf.line(MARGIN, row_top - row_h, PAGE_W - MARGIN, row_top - row_h)
        row_top -= row_h

    _draw_footer(pdf, 1, page_count)


def _prepare_detail_question(question: dict, available_width: float) -> dict:
    question_text_width = available_width - 13 * MM - 8 - 29 * MM
    option_text_width = available_width - 13 * MM - 5 * MM
    question_lines = _wrap(question["question_text"], FONT_REGULAR, 8.1, question_text_width)
    option_lines = []
    for option_row in question.get("option_rows") or []:
        option_font = (
            FONT_BOLD
            if option_row.get("is_correct") and question.get("is_answered")
            else FONT_REGULAR
        )
        lines = _wrap(option_row.get("label") or "", option_font, 7.4, option_text_width)
        option_lines.append({**option_row, "lines": lines})
    feedback = f"Răspuns elev: {question['selected_answer'] if question.get('is_answered') else '—'}"
    if question.get("is_answered") and not question.get("is_correct"):
        feedback += f"   |   Varianta corectă: {question.get('correct_answer') or '—'}"
    feedback_lines = _wrap(feedback, FONT_REGULAR, 7.5, option_text_width)
    height = (
        13
        + len(question_lines) * 9.5
        + 10
        + sum(max(1, len(row["lines"])) * 8.5 + 2 for row in option_lines)
        + 7
        + len(feedback_lines) * 9
        + 10
    )
    return {
        **question,
        "question_lines": question_lines,
        "detail_option_rows": option_lines,
        "feedback_lines": feedback_lines,
        "card_height": max(height, 67),
    }


def _paginate_details(groups: list[dict]) -> list[dict]:
    pages: list[dict] = []
    available_width = PAGE_W - 2 * MARGIN
    available_height = PAGE_H - 42 * MM - CONTENT_BOTTOM
    for group in groups:
        prepared = [_prepare_detail_question(question, available_width) for question in group["questions"]]
        current: list[dict] = []
        used = 0.0
        for question in prepared:
            required = question["card_height"] + (8 if current else 0)
            if current and used + required > available_height:
                pages.append({**group, "questions": current})
                current = [question]
                used = question["card_height"]
            else:
                current.append(question)
                used += required
        if current:
            pages.append({**group, "questions": current})
    return pages


def _draw_detail_card(pdf: canvas.Canvas, question: dict, y: float) -> float:
    x = MARGIN
    width = PAGE_W - 2 * MARGIN
    height = question["card_height"]
    bottom = y - height
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.55)
    pdf.roundRect(x, bottom, width, height, 4, fill=0, stroke=1)

    status_right = x + width - 8
    question_x = x + 13 * MM
    question_width = status_right - question_x - 29 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.circle(x + 7 * MM, y - 10 * MM, 3.4 * MM, fill=1, stroke=0)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_BOLD, 7.5)
    pdf.drawCentredString(x + 7 * MM, y - 10.8 * MM, str(question["index"]))
    _draw_lines(
        pdf,
        _wrap(question["question_text"], FONT_REGULAR, 8.1, question_width),
        question_x,
        y - 7.8 * MM,
        FONT_REGULAR,
        8.1,
        9.5,
        TEXT,
    )
    _draw_status_pill(pdf, question, status_right, y - 10 * MM, 6.4)

    header_height = 13 + len(question["question_lines"]) * 9.5
    divider_y = y - header_height
    cursor_y = divider_y - 10
    option_x = x + 13 * MM
    for option_row in question["detail_option_rows"]:
        option_color = TEXT
        if option_row.get("is_correct") and question.get("is_answered"):
            option_color = SUCCESS
        elif option_row.get("is_selected") and not question.get("is_correct"):
            option_color = DANGER
        cursor_y = _draw_lines(
            pdf,
            option_row["lines"],
            option_x,
            cursor_y,
            FONT_BOLD if option_row.get("is_correct") and question.get("is_answered") else FONT_REGULAR,
            7.4,
            8.5,
            option_color,
        )
        cursor_y -= 2

    cursor_y -= 4
    pdf.setStrokeColor(LINE)
    pdf.setDash(1.5, 1.5)
    pdf.line(option_x, cursor_y, x + width - 5 * MM, cursor_y)
    pdf.setDash()
    cursor_y -= 9
    _draw_lines(pdf, question["feedback_lines"], option_x, cursor_y, FONT_REGULAR, 7.5, 9, TEXT)
    return bottom


def _draw_detail_page(
    pdf: canvas.Canvas,
    detail_page: dict,
    page_number: int,
    page_count: int,
) -> None:
    header_y = _draw_header(pdf, compact=True)
    title_y = header_y - 9 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 13.5)
    pdf.drawString(MARGIN, title_y, f"{detail_page['code']}. {detail_page['title']}")
    first_number = detail_page["questions"][0]["index"]
    last_number = detail_page["questions"][-1]["index"]
    pdf.setFillColor(MUTED)
    pdf.setFont(FONT_REGULAR, 7.5)
    pdf.drawRightString(PAGE_W - MARGIN, title_y, f"Întrebările {first_number}–{last_number}")

    y = title_y - 6 * MM
    for question in detail_page["questions"]:
        y = _draw_detail_card(pdf, question, y)
        y -= 8
    _draw_footer(pdf, page_number, page_count)


def build_integrated_pdf_report(source: dict, normalized_payload: dict, output_target):
    questions = list(normalized_payload.get("questions") or [])
    zones = _build_zones(questions)
    groups = _group_questions(questions)
    detail_pages = _paginate_details(groups)
    page_count = 1 + len(detail_pages)
    report = {
        "student_name": _clean(normalized_payload.get("student_name") or "Elev"),
        "test_title": _clean(normalized_payload.get("test_title") or "Test integrat"),
        "date": _format_date(normalized_payload.get("submitted_at")),
        "duration": _format_duration(normalized_payload.get("duration_seconds")),
        "questions": questions,
        "zones": zones,
        "groups": groups,
    }

    pdf = canvas.Canvas(output_target, pagesize=A4, pageCompression=1)
    pdf.setTitle(report["test_title"])
    pdf.setAuthor("Logica by A mentor")
    pdf.setSubject("Raport finalizare test integrat")
    _draw_summary_page(pdf, report, page_count)
    for page_index, detail_page in enumerate(detail_pages, start=2):
        pdf.showPage()
        _draw_detail_page(pdf, detail_page, page_index, page_count)
    pdf.save()
    return output_target
