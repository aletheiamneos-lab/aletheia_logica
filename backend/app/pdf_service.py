from __future__ import annotations

import io
import math
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import getAscentDescent, stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .integrated_report_pdf import build_integrated_pdf_report

PAGE_W, PAGE_H = A4
MM = 72 / 25.4

MARGIN_L = 15 * MM
MARGIN_R = 15 * MM
MARGIN_TOP = 15.5 * MM
MARGIN_BOTTOM = 15 * MM
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R
CONTENT_TOP = PAGE_H - MARGIN_TOP
CONTENT_BOTTOM = MARGIN_BOTTOM

BG = HexColor("#f7f7f7")
TEXT = HexColor("#222222")
MUTED = HexColor("#6b7280")
ACCENT = HexColor("#1f4e79")
GREEN = HexColor("#2e7d32")
RED = HexColor("#c62828")
GRID = HexColor("#d8dde6")
LIGHT_LINE = HexColor("#dfe4ec")
RADAR_FILL = colors.Color(31 / 255, 78 / 255, 121 / 255, alpha=0.18)

QUESTION_TITLE_FONT = 8.2
QUESTION_TEXT_FONT = 8.2
QUESTION_OPTION_FONT = 7.3
ANSWER_TEXT_FONT = 7.8
QUESTION_TITLE_LEADING = 3.8 * MM
QUESTION_TEXT_LEADING = 3.8 * MM
QUESTION_OPTION_LEADING = 3.3 * MM
ANSWER_TEXT_LEADING = 3.6 * MM
QUESTION_SPACE_AFTER_TITLE = 0.65 * MM
QUESTION_SPACE_AFTER_TEXT = 0.8 * MM
QUESTION_SPACE_BETWEEN_OPTIONS = 0.45 * MM
QUESTION_SPACE_AFTER_OPTIONS = 0.8 * MM
QUESTION_SPACE_BETWEEN_ANSWERS = 0.75 * MM
SEPARATOR_PRE_SPACE = 2.0 * MM
SEPARATOR_POST_SPACE = 2.5 * MM
SEPARATOR_BLOCK_HEIGHT = SEPARATOR_PRE_SPACE + SEPARATOR_POST_SPACE
QUESTION_PAGE_HEADER_OFFSET = 5.2 * MM
QUESTION_COLUMN_GAP = 8 * MM
QUESTION_STATUS_FONT = 8.2
QUESTION_STATUS_GAP = 2.1 * MM
QUESTION_STATUS_WIDTH = 14.5 * MM
QUESTION_COLUMNS_PER_PAGE = 2
QUESTION_OPTION_INDENT = 3.1 * MM

CANONICAL_CATEGORY_ORDER = [
    "Definitii",
    "Clasificare",
    "Propozitii",
    "Silogisme",
    "Erori",
]

CANONICAL_CATEGORY_RANGES = [
    (1, 5, "Definitii"),
    (6, 10, "Clasificare"),
    (11, 15, "Propozitii"),
    (16, 20, "Silogisme"),
    (21, 25, "Erori"),
]


def _resolve_pdf_fonts() -> tuple[str, str]:
    candidates = [
        (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf"), "Arial"),
        (
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
            "DejaVuSans",
        ),
        (Path("/Library/Fonts/Arial.ttf"), Path("/Library/Fonts/Arial Bold.ttf"), "ArialMac"),
    ]

    for regular_path, bold_path, family_name in candidates:
        if not regular_path.exists() or not bold_path.exists():
            continue

        regular_font_name = f"LogicaPDF-{family_name}-Regular"
        bold_font_name = f"LogicaPDF-{family_name}-Bold"

        try:
            if regular_font_name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(regular_font_name, str(regular_path)))
            if bold_font_name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(bold_font_name, str(bold_path)))
            return regular_font_name, bold_font_name
        except Exception:
            continue

    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = _resolve_pdf_fonts()


def strip_diacritics(value: str | None) -> str:
    if value is None:
        return ""
    normalized = unicodedata.normalize("NFD", str(value))
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def clean_text(value: str | None) -> str:
    value = str(value or "")
    value = value.replace("\n", " ").replace("\r", " ")
    return re.sub(r"\s+", " ", value).strip()


def normalize_ascii_text(value: str | None) -> str:
    return strip_diacritics(clean_text(value))


def safe_filename_name(name: str | None) -> str:
    name = normalize_ascii_text(name).lower()
    name = re.sub(r"[^a-z0-9]+", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    return name or "elev"


def parse_date(value: str | None) -> datetime:
    if not value:
        return datetime.now()
    value = value.strip()
    for fmt in [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d.%m.%Y %H:%M:%S",
        "%d.%m.%Y %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
    ]:
        try:
            return datetime.strptime(value[:19], fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return datetime.now()


def format_duration(seconds: int) -> str:
    seconds = max(0, int(seconds or 0))
    return f"{seconds // 60}m {seconds % 60:02d}s"


def build_export_filename(
    student_name: str | None,
    submitted_at: str | None = None,
    *,
    student_first_name: str | None = None,
    student_last_name: str | None = None,
) -> str:
    if clean_text(student_first_name) or clean_text(student_last_name):
        name_value = " ".join(
            part for part in [clean_text(student_first_name), clean_text(student_last_name)] if part
        )
    else:
        name_value = student_name or ""
    dt = parse_date(submitted_at)
    return f"{safe_filename_name(name_value)}_{dt.strftime('%Y-%m-%d_%H-%M')}.pdf"


def build_content_disposition(file_name: str, disposition: str = "attachment") -> str:
    safe_name = clean_text(file_name).replace('"', "") or "raport_evaluare.pdf"
    return f"{disposition}; filename=\"{safe_name}\"; filename*=UTF-8''{quote(safe_name)}"


def _coerce_int(value) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def _canonical_category_from_index(index: int) -> str | None:
    for start, end, label in CANONICAL_CATEGORY_RANGES:
        if start <= index <= end:
            return label
    return None


def _normalize_category_label(label: str | None) -> str:
    normalized = normalize_ascii_text(label).lower()
    if "def" in normalized:
        return "Definitii"
    if "clas" in normalized:
        return "Clasificare"
    if "prop" in normalized:
        return "Propozitii"
    if "eror" in normalized:
        return "Erori"
    if "silog" in normalized or "ration" in normalized:
        return "Silogisme"
    return clean_text(label).title() or "Categorie"


def _option_label(index: int) -> str:
    labels = ["A", "B", "C", "D", "E"]
    if 0 <= index < len(labels):
        return labels[index]
    return str(index + 1)


def _build_wrapped_word(word: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    chunks: list[str] = []
    current = ""
    for character in word:
        trial = f"{current}{character}"
        if current and stringWidth(trial, font_name, font_size) > max_width:
            chunks.append(current)
            current = character
        else:
            current = trial
    if current:
        chunks.append(current)
    return chunks or [word]


def wrap_lines(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    text = clean_text(text)
    if not text:
        return [""]

    words = text.split(" ")
    lines: list[str] = []
    current = ""

    for word in words:
        if stringWidth(word, font_name, font_size) > max_width:
            oversized_chunks = _build_wrapped_word(word, font_name, font_size, max_width)
        else:
            oversized_chunks = [word]

        for chunk in oversized_chunks:
            trial = chunk if not current else f"{current} {chunk}"
            if stringWidth(trial, font_name, font_size) <= max_width:
                current = trial
            else:
                if current:
                    lines.append(current)
                current = chunk

    if current:
        lines.append(current)

    return lines or [""]


def draw_lines(
    c: canvas.Canvas,
    lines: list[str],
    x: float,
    y: float,
    font_name: str,
    font_size: float,
    leading: float,
    fill=TEXT,
) -> float:
    c.setFont(font_name, font_size)
    c.setFillColor(fill)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def fill_background(c: canvas.Canvas) -> None:
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def draw_watermark(c: canvas.Canvas) -> None:
    c.setFont(FONT_REGULAR, 7)
    c.setFillColor(HexColor("#9a9a9a"))
    c.drawRightString(PAGE_W - MARGIN_R, 9.5 * MM, "made by A mentor")


def page_title(c: canvas.Canvas, page_no: int, student_name: str) -> None:
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 9.8)
    c.drawString(MARGIN_L, CONTENT_TOP, "Raport evaluare")
    c.setFont(FONT_REGULAR, 7.8)
    c.setFillColor(MUTED)
    c.drawRightString(PAGE_W - MARGIN_R, CONTENT_TOP, f"Pagina {page_no} - {clean_text(student_name)}")
    c.setStrokeColor(LIGHT_LINE)
    c.setLineWidth(0.35)
    separator_y = CONTENT_TOP - 1.7 * MM
    c.line(MARGIN_L, separator_y, PAGE_W - MARGIN_R, separator_y)


def _normalize_option_rows(entry: dict) -> list[dict]:
    raw_option_rows = entry.get("option_rows") or entry.get("optionRows") or []
    normalized_rows: list[dict] = []

    if isinstance(raw_option_rows, list):
        for option_index, option_row in enumerate(raw_option_rows):
            if not isinstance(option_row, dict):
                continue
            option_label = clean_text(
                option_row.get("label")
                or f"{option_row.get('option_key') or option_row.get('optionKey') or option_row.get('key') or _option_label(option_index)}. {option_row.get('text') or ''}"
            )
            if not option_label:
                continue
            normalized_rows.append(
                {
                    "label": option_label,
                    "is_selected": bool(option_row.get("is_selected") or option_row.get("isSelected")),
                    "is_correct": bool(option_row.get("is_correct") or option_row.get("isCorrect")),
                }
            )
        if normalized_rows:
            return normalized_rows

    raw_options = entry.get("options") or []
    selected_index = entry.get("selected_option_index")
    if not isinstance(selected_index, int):
        selected_index = entry.get("selectedOptionIndex")
    correct_index = entry.get("correct_option_index")
    if not isinstance(correct_index, int):
        correct_index = entry.get("correctOptionIndex")

    if isinstance(raw_options, list):
        for option_index, option_text in enumerate(raw_options):
            option_label = clean_text(f"{_option_label(option_index)}. {option_text}")
            if not option_label:
                continue
            normalized_rows.append(
                {
                    "label": option_label,
                    "is_selected": selected_index == option_index,
                    "is_correct": correct_index == option_index,
                }
            )

    return normalized_rows


def _normalize_question_entry(entry: dict, position: int) -> dict:
    index = _coerce_int(entry.get("index") or entry.get("orderInTest") or entry.get("order_in_test") or position + 1)
    canonical_category = _canonical_category_from_index(index)
    source_category = _normalize_category_label(
        entry.get("lesson")
        or entry.get("category")
        or entry.get("category_label")
        or entry.get("categoryLabel")
        or entry.get("lesson_label")
        or entry.get("lessonLabel")
    )
    category_label = canonical_category or source_category

    selected_answer = clean_text(
        entry.get("selected_answer")
        or entry.get("selectedAnswer")
        or entry.get("student_answer_label")
        or entry.get("studentAnswerLabel")
        or "Fara raspuns"
    )
    correct_answer = clean_text(
        entry.get("correct_answer")
        or entry.get("correctAnswer")
        or entry.get("correct_answer_label")
        or entry.get("correctAnswerLabel")
        or "Fara raspuns"
    )

    option_rows = _normalize_option_rows(entry)
    selected_option_index = entry.get("selected_option_index")
    if not isinstance(selected_option_index, int):
        selected_option_index = entry.get("selectedOptionIndex")
    is_answered = isinstance(selected_option_index, int) or any(row.get("is_selected") for row in option_rows)

    return {
        "index": index,
        "lesson": category_label,
        "question_text": clean_text(
            entry.get("question_text")
            or entry.get("questionText")
            or entry.get("text")
            or entry.get("question")
            or ""
        ),
        "option_rows": option_rows,
        "selected_answer": selected_answer or "Fara raspuns",
        "correct_answer": correct_answer or "Fara raspuns",
        "is_answered": is_answered,
        "is_correct": bool(entry.get("is_correct") or entry.get("isCorrect") or False),
    }


def _build_category_breakdown(questions: list[dict]) -> list[dict]:
    stats = {
        label: {"label": label, "correct": 0, "total": 0}
        for label in CANONICAL_CATEGORY_ORDER
    }

    for question in questions:
        label = _canonical_category_from_index(question["index"]) or _normalize_category_label(question["lesson"])
        question["lesson"] = label
        bucket = stats.setdefault(label, {"label": label, "correct": 0, "total": 0})
        bucket["total"] += 1
        if question["is_correct"]:
            bucket["correct"] += 1

    return [stats[label] for label in CANONICAL_CATEGORY_ORDER if stats[label]["total"] > 0]


def _normalize_source_categories(source_categories: list[dict]) -> list[dict]:
    merged: dict[str, dict] = {}
    for category in source_categories:
        if not isinstance(category, dict):
            continue
        label = _normalize_category_label(category.get("label") or category.get("category") or category.get("name"))
        total = _coerce_int(category.get("total") or category.get("totalCount") or category.get("total_count"))
        if total <= 0:
            continue
        correct = _coerce_int(category.get("correct") or category.get("correctCount") or category.get("correct_count"))
        if label not in merged:
            merged[label] = {"label": label, "correct": 0, "total": 0}
        merged[label]["correct"] += max(correct, 0)
        merged[label]["total"] += max(total, 0)
    return [merged[label] for label in CANONICAL_CATEGORY_ORDER if merged.get(label, {}).get("total", 0) > 0]


def normalize_export_payload(source: dict) -> dict:
    raw_questions = source.get("questions") or source.get("questionRows") or source.get("question_rows") or []
    questions = [
        _normalize_question_entry(entry, index)
        for index, entry in enumerate(raw_questions)
        if isinstance(entry, dict)
    ]
    questions.sort(key=lambda entry: entry["index"])

    raw_categories = (
        source.get("categories")
        or source.get("categoryBreakdown")
        or source.get("category_breakdown")
        or source.get("lessonRadar")
        or source.get("lesson_radar")
        or []
    )
    categories = _build_category_breakdown(questions) if questions else _normalize_source_categories(raw_categories)

    return {
        "student_name": clean_text(
            source.get("student_name") or source.get("studentName") or source.get("student_display_name")
        )
        or "Elev",
        "student_first_name": clean_text(source.get("student_first_name") or source.get("studentFirstName")) or "",
        "student_last_name": clean_text(source.get("student_last_name") or source.get("studentLastName")) or "",
        "test_title": clean_text(source.get("test_title") or source.get("testTitle") or "Raport evaluare"),
        "submitted_at": clean_text(source.get("submitted_at") or source.get("submittedAt")),
        "duration_seconds": _coerce_int(source.get("duration_seconds") or source.get("durationSeconds") or 0),
        "categories": categories,
        "questions": questions,
    }


def _prepare_question_layout(question: dict) -> dict:
    column_width = (CONTENT_W - QUESTION_COLUMN_GAP) / QUESTION_COLUMNS_PER_PAGE
    text_width = column_width - QUESTION_STATUS_WIDTH - QUESTION_STATUS_GAP

    question_lines = wrap_lines(question["question_text"], FONT_REGULAR, QUESTION_TEXT_FONT, text_width)
    option_rows = []
    options_height = 0.0
    for option_row in question["option_rows"]:
        option_lines = wrap_lines(
            option_row["label"],
            FONT_REGULAR,
            QUESTION_OPTION_FONT,
            max(text_width - QUESTION_OPTION_INDENT, 20),
        )
        option_rows.append({**option_row, "lines": option_lines})
        options_height += len(option_lines) * QUESTION_OPTION_LEADING
        options_height += QUESTION_SPACE_BETWEEN_OPTIONS

    if option_rows:
        options_height -= QUESTION_SPACE_BETWEEN_OPTIONS

    student_lines = wrap_lines(
        f"Raspuns elev: {question['selected_answer'] or 'Fara raspuns'}",
        FONT_REGULAR,
        ANSWER_TEXT_FONT,
        text_width,
    )
    correct_lines = wrap_lines(
        f"Raspuns corect: {question['correct_answer'] or 'Fara raspuns'}",
        FONT_REGULAR,
        ANSWER_TEXT_FONT,
        text_width,
    )

    core_height = (
        QUESTION_TITLE_LEADING
        + QUESTION_SPACE_AFTER_TITLE
        + (len(question_lines) * QUESTION_TEXT_LEADING)
        + QUESTION_SPACE_AFTER_TEXT
        + options_height
        + (QUESTION_SPACE_AFTER_OPTIONS if option_rows else 0)
        + (len(student_lines) * ANSWER_TEXT_LEADING)
        + QUESTION_SPACE_BETWEEN_ANSWERS
        + (len(correct_lines) * ANSWER_TEXT_LEADING)
    )

    return {
        **question,
        "question_lines": question_lines,
        "option_rows": option_rows,
        "student_lines": student_lines,
        "correct_lines": correct_lines,
        "core_height": core_height,
        "text_width": text_width,
    }


def _layout_group_height(items: list[dict]) -> float:
    total = sum(item["core_height"] for item in items)
    total += max(0, len(items) - 1) * SEPARATOR_BLOCK_HEIGHT
    return total


def _balance_layouts_into_columns(
    layouts: list[dict], desired_columns: int, available_height: float
) -> list[list[dict]] | None:
    if desired_columns <= 0 or desired_columns > len(layouts):
        return None

    columns: list[list[dict]] = []
    cursor = 0

    for column_index in range(desired_columns):
        remaining_columns = desired_columns - column_index
        remaining_layouts = layouts[cursor:]
        if not remaining_layouts:
            return None

        target_height = _layout_group_height(remaining_layouts) / remaining_columns
        current_column: list[dict] = []
        current_height = 0.0

        while cursor < len(layouts):
            layout = layouts[cursor]
            layout_height = layout["core_height"] + (SEPARATOR_BLOCK_HEIGHT if current_column else 0.0)
            next_height = current_height + layout_height
            remaining_after = len(layouts) - (cursor + 1)
            min_items_for_remaining_columns = remaining_columns - 1
            keep_for_next_columns = remaining_after >= min_items_for_remaining_columns

            should_break_for_balance = current_column and next_height > target_height and keep_for_next_columns
            if current_column and (next_height > available_height or should_break_for_balance):
                break

            current_column.append(layout)
            current_height = next_height
            cursor += 1

            if len(layouts) - cursor == remaining_columns - 1:
                break

        if not current_column or current_height > available_height:
            return None

        columns.append(current_column)

    if cursor != len(layouts):
        return None

    return columns


def _paginate_question_layouts(layouts: list[dict]) -> list[list[dict]]:
    if not layouts:
        return []

    top_y = CONTENT_TOP - QUESTION_PAGE_HEADER_OFFSET
    available_height = top_y - CONTENT_BOTTOM

    preferred_column_count = min(len(layouts), max(1, math.ceil(len(layouts) / 7)))
    balanced_columns = _balance_layouts_into_columns(layouts, preferred_column_count, available_height)
    if balanced_columns:
        return balanced_columns

    pages: list[list[dict]] = []
    current_page: list[dict] = []
    current_height = 0.0

    for layout in layouts:
        required_height = layout["core_height"]
        if current_page:
            required_height += SEPARATOR_BLOCK_HEIGHT

        if current_page and current_height + required_height > available_height:
            pages.append(current_page)
            current_page = [layout]
            current_height = layout["core_height"]
            continue

        if current_page:
            current_height += SEPARATOR_BLOCK_HEIGHT

        current_page.append(layout)
        current_height += layout["core_height"]

    if current_page:
        pages.append(current_page)

    if len(pages) > 1:
        desired_page_count = len(pages)
        base_count, remainder = divmod(len(layouts), desired_page_count)
        desired_counts = [
            base_count + (1 if page_index < remainder else 0)
            for page_index in range(desired_page_count)
        ]

        balanced_pages: list[list[dict]] = []
        cursor = 0
        can_balance = True
        for desired_count in desired_counts:
            next_slice = layouts[cursor : cursor + desired_count]
            if len(next_slice) != desired_count or _layout_group_height(next_slice) > available_height:
                can_balance = False
                break
            balanced_pages.append(next_slice)
            cursor += desired_count

        if can_balance and cursor == len(layouts):
            return balanced_pages

    if len(pages) > 1 and len(pages[-1]) == 1:
        last_page = pages[-1]
        previous_page = pages[-2]
        while len(last_page) < 2 and len(previous_page) > 1:
            moved_item = previous_page.pop()
            last_page.insert(0, moved_item)
            if _layout_group_height(previous_page) <= available_height and _layout_group_height(last_page) <= available_height:
                break

    return [page for page in pages if page]


def draw_radar(c: canvas.Canvas, x: float, y: float, size: float, categories: list[dict]) -> None:
    cats = [category for category in categories if _coerce_int(category.get("total")) > 0]
    if len(cats) < 3:
        c.setFont(FONT_REGULAR, 9)
        c.setFillColor(MUTED)
        c.drawCentredString(x + size / 2, y + size / 2, "Date insuficiente pentru radar")
        return

    center_x = x + size / 2
    center_y = y + size / 2
    radius = size * 0.36
    total_categories = len(cats)
    values = [
        (_coerce_int(category.get("correct")) / _coerce_int(category.get("total")))
        if _coerce_int(category.get("total"))
        else 0
        for category in cats
    ]

    c.setLineWidth(0.4)
    c.setStrokeColor(GRID)
    for level in [0.2, 0.4, 0.6, 0.8, 1.0]:
        points = []
        for index in range(total_categories):
            angle = math.pi / 2 - (2 * math.pi * index / total_categories)
            points.append(
                (
                    center_x + radius * level * math.cos(angle),
                    center_y + radius * level * math.sin(angle),
                )
            )
        path = c.beginPath()
        path.moveTo(points[0][0], points[0][1])
        for point_x, point_y in points[1:]:
            path.lineTo(point_x, point_y)
        path.close()
        c.drawPath(path, stroke=1, fill=0)

    c.setFont(FONT_REGULAR, 7.4)
    for index, category in enumerate(cats):
        angle = math.pi / 2 - (2 * math.pi * index / total_categories)
        axis_x = center_x + radius * math.cos(angle)
        axis_y = center_y + radius * math.sin(angle)
        c.setStrokeColor(HexColor("#e7ebf2"))
        c.line(center_x, center_y, axis_x, axis_y)

        label_x = center_x + radius * 1.24 * math.cos(angle)
        label_y = center_y + radius * 1.24 * math.sin(angle)
        c.setFillColor(MUTED)
        c.drawCentredString(label_x, label_y, clean_text(category["label"]))

    polygon_points = []
    for index, value in enumerate(values):
        angle = math.pi / 2 - (2 * math.pi * index / total_categories)
        polygon_points.append(
            (
                center_x + radius * value * math.cos(angle),
                center_y + radius * value * math.sin(angle),
            )
        )

    polygon = c.beginPath()
    polygon.moveTo(polygon_points[0][0], polygon_points[0][1])
    for point_x, point_y in polygon_points[1:]:
        polygon.lineTo(point_x, point_y)
    polygon.close()
    c.setFillColor(RADAR_FILL)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(2.1)
    c.drawPath(polygon, stroke=1, fill=1)

    c.setFillColor(ACCENT)
    for point_x, point_y in polygon_points:
        c.circle(point_x, point_y, 1.75, fill=1, stroke=0)


def draw_summary_page(c: canvas.Canvas, payload: dict) -> None:
    fill_background(c)

    submitted_at = parse_date(payload["submitted_at"])
    categories = payload["categories"]
    questions = payload["questions"]
    total_questions = len(questions)
    total_correct = sum(1 for question in questions if question["is_correct"])
    wrong_count = max(total_questions - total_correct, 0)
    percent = round((total_correct / total_questions) * 100) if total_questions else 0

    top_y = PAGE_H - 18 * MM
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 19)
    c.drawString(MARGIN_L, top_y, "Raport evaluare")

    c.setFont(FONT_BOLD, 13.2)
    c.drawString(MARGIN_L, top_y - 8 * MM, clean_text(payload["student_name"]))
    c.setFont(FONT_REGULAR, 9.6)
    c.setFillColor(MUTED)
    c.drawString(MARGIN_L, top_y - 13 * MM, clean_text(payload["test_title"]))

    score_box_x = PAGE_W - MARGIN_R - 46 * MM
    score_box_y = PAGE_H - 43 * MM
    score_box_w = 46 * MM
    score_box_h = 24 * MM
    c.setFillColor(colors.white)
    c.roundRect(score_box_x, score_box_y, score_box_w, score_box_h, 7, fill=1, stroke=0)
    c.setFillColor(MUTED)
    c.setFont(FONT_BOLD, 7.6)
    c.drawString(score_box_x + 5 * MM, score_box_y + score_box_h - 7.2 * MM, "SCOR FINAL")
    c.setFillColor(ACCENT)
    c.setFont(FONT_BOLD, 22)
    c.drawString(score_box_x + 5 * MM, score_box_y + 8.6 * MM, f"{percent}%")
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 10.2)
    c.drawRightString(score_box_x + score_box_w - 5 * MM, score_box_y + 9.0 * MM, f"{total_correct}/{total_questions}")

    c.setStrokeColor(LIGHT_LINE)
    c.setLineWidth(0.45)
    c.line(MARGIN_L, PAGE_H - 49 * MM, PAGE_W - MARGIN_R, PAGE_H - 49 * MM)

    radar_title_y = PAGE_H - 58 * MM
    c.setFillColor(TEXT)
    c.setFont(FONT_BOLD, 11)
    c.drawString(MARGIN_L, radar_title_y, "Radar pe categorii")

    stats_title_x = MARGIN_L + 98 * MM
    c.drawString(stats_title_x, radar_title_y, "Statistici")

    radar_size = 88 * MM
    radar_x = MARGIN_L
    radar_y = PAGE_H - 166 * MM
    draw_radar(c, radar_x, radar_y, radar_size, categories)

    stats_x = stats_title_x
    stats_y = PAGE_H - 66 * MM
    stats_items = [
        ("Test", clean_text(payload["test_title"])),
        ("Data", submitted_at.strftime("%Y-%m-%d")),
        ("Ora", submitted_at.strftime("%H:%M")),
        ("Timp", format_duration(payload["duration_seconds"])),
        ("Scor total", f"{total_correct} / {total_questions}"),
        ("Procent", f"{percent}%"),
        ("Gresite", str(wrong_count)),
    ]

    for label, value in stats_items:
        c.setFillColor(MUTED)
        c.setFont(FONT_BOLD, 7.6)
        c.drawString(stats_x, stats_y, label.upper())
        c.setFillColor(TEXT)
        c.setFont(FONT_REGULAR, 9.2)
        c.drawString(stats_x, stats_y - 4.2 * MM, value)
        stats_y -= 9.2 * MM

    stats_y -= 1.0 * MM
    c.setStrokeColor(LIGHT_LINE)
    c.setLineWidth(0.35)
    c.line(stats_x, stats_y, PAGE_W - MARGIN_R, stats_y)
    stats_y -= 6.0 * MM

    c.setFillColor(MUTED)
    c.setFont(FONT_BOLD, 7.6)
    c.drawString(stats_x, stats_y, "SCOR PE CATEGORII")
    stats_y -= 5.2 * MM

    for category in categories:
        total = _coerce_int(category.get("total"))
        correct = _coerce_int(category.get("correct"))
        if total <= 0:
            continue
        percentage = round((correct / total) * 100) if total else 0
        c.setFillColor(TEXT)
        c.setFont(FONT_BOLD, 8.4)
        c.drawString(stats_x, stats_y, clean_text(category["label"]))
        c.drawRightString(PAGE_W - MARGIN_R, stats_y, f"{percentage}%")
        c.setFillColor(MUTED)
        c.setFont(FONT_REGULAR, 7.8)
        c.drawString(stats_x, stats_y - 3.8 * MM, f"{correct} / {total} corecte")
        stats_y -= 8.1 * MM

    draw_watermark(c)


def draw_question(
    c: canvas.Canvas,
    layout: dict,
    y: float,
    column_x: float,
    column_width: float,
) -> float:
    status_label = "CORECT" if layout["is_correct"] else "GRESIT"
    status_color = GREEN if layout["is_correct"] else RED
    status_right_x = column_x + column_width
    status_center_y = y - (layout["core_height"] / 2)
    status_ascent, status_descent = getAscentDescent(FONT_BOLD, QUESTION_STATUS_FONT)
    status_baseline_y = status_center_y - ((status_ascent + status_descent) / 2)

    c.setFont(FONT_BOLD, QUESTION_TITLE_FONT)
    c.setFillColor(TEXT)
    c.drawString(column_x, y, f"{layout['index']:02d}. {clean_text(layout['lesson'])}")
    c.setFont(FONT_BOLD, QUESTION_STATUS_FONT)
    c.setFillColor(status_color)
    c.drawRightString(status_right_x, status_baseline_y, status_label)
    y -= QUESTION_TITLE_LEADING

    y -= QUESTION_SPACE_AFTER_TITLE
    y = draw_lines(
        c,
        layout["question_lines"],
        column_x,
        y,
        FONT_REGULAR,
        QUESTION_TEXT_FONT,
        QUESTION_TEXT_LEADING,
        TEXT,
    )

    y -= QUESTION_SPACE_AFTER_TEXT
    for option_row in layout["option_rows"]:
        option_fill = MUTED
        if option_row["is_correct"]:
            option_fill = GREEN
        elif option_row["is_selected"]:
            option_fill = ACCENT

        y = draw_lines(
            c,
            option_row["lines"],
            column_x + QUESTION_OPTION_INDENT,
            y,
            FONT_REGULAR,
            QUESTION_OPTION_FONT,
            QUESTION_OPTION_LEADING,
            option_fill,
        )
        y -= QUESTION_SPACE_BETWEEN_OPTIONS

    if layout["option_rows"]:
        y += QUESTION_SPACE_BETWEEN_OPTIONS
        y -= QUESTION_SPACE_AFTER_OPTIONS

    y = draw_lines(
        c,
        layout["student_lines"],
        column_x,
        y,
        FONT_REGULAR,
        ANSWER_TEXT_FONT,
        ANSWER_TEXT_LEADING,
        MUTED,
    )

    y -= QUESTION_SPACE_BETWEEN_ANSWERS
    y = draw_lines(
        c,
        layout["correct_lines"],
        column_x,
        y,
        FONT_REGULAR,
        ANSWER_TEXT_FONT,
        ANSWER_TEXT_LEADING,
        TEXT,
    )

    return y


def draw_questions_pages(c: canvas.Canvas, payload: dict) -> None:
    prepared_layouts = [_prepare_question_layout(question) for question in payload["questions"]]
    pages = _paginate_question_layouts(prepared_layouts)

    if not pages:
        return

    top_y = CONTENT_TOP - QUESTION_PAGE_HEADER_OFFSET
    available_height = top_y - CONTENT_BOTTOM
    column_width = (CONTENT_W - QUESTION_COLUMN_GAP) / QUESTION_COLUMNS_PER_PAGE

    total_pages = math.ceil(len(pages) / QUESTION_COLUMNS_PER_PAGE)
    for page_offset in range(total_pages):
        page_index = page_offset + 2
        fill_background(c)
        page_title(c, page_index, payload["student_name"])

        page_columns = pages[
            page_offset * QUESTION_COLUMNS_PER_PAGE : (page_offset + 1) * QUESTION_COLUMNS_PER_PAGE
        ]
        page_block_height = max((_layout_group_height(column) for column in page_columns), default=0.0)
        start_y = top_y - max(0.0, (available_height - page_block_height) / 2)

        for column_offset in range(QUESTION_COLUMNS_PER_PAGE):
            column_index = page_offset * QUESTION_COLUMNS_PER_PAGE + column_offset
            if column_index >= len(pages):
                break

            column_x = MARGIN_L + column_offset * (column_width + QUESTION_COLUMN_GAP)
            y = start_y

            for item_index, layout in enumerate(pages[column_index]):
                y = draw_question(c, layout, y, column_x, column_width)
                is_last_item = item_index == len(pages[column_index]) - 1
                if is_last_item:
                    continue

                y -= SEPARATOR_PRE_SPACE
                c.setStrokeColor(LIGHT_LINE)
                c.setLineWidth(0.3)
                c.line(column_x, y, column_x + column_width, y)
                y -= SEPARATOR_POST_SPACE

        draw_watermark(c)
        if page_offset < total_pages - 1:
            c.showPage()


def _option_key_from_label(label: str, fallback_index: int) -> str:
    match = re.match(r"\s*([A-Z])(?:[.)]\s+|\s+-\s+|\s+)", str(label or "").strip(), re.IGNORECASE)
    return (match.group(1).upper() if match else _option_label(fallback_index))


def _option_text_from_label(label: str) -> str:
    return re.sub(r"^\s*[A-Z][.)]\s*", "", str(label or "").strip(), flags=re.IGNORECASE)


def _build_integrated_report_payload(source: dict, payload: dict) -> dict:
    categories = payload.get("categories") or []
    total_questions = len(payload.get("questions") or [])
    correct_count = sum(1 for question in payload.get("questions") or [] if question.get("is_correct"))
    score_percent = round((correct_count / total_questions) * 100) if total_questions else 0

    radar = []
    groups_by_label: dict[str, dict] = {}
    for index, category in enumerate(categories):
        label = clean_text(category.get("label") or f"Categoria {index + 1}")
        total = _coerce_int(category.get("total"))
        correct = _coerce_int(category.get("correct"))
        value = round((correct / total) * 100) if total else 0
        axis = label if len(label) <= 18 else f"L{index + 1}"
        radar.append({"axis": axis, "value": value})
        groups_by_label[label] = {
            "code": f"L{index + 1}",
            "title": label,
            "questionRange": "",
            "sharedText": "",
            "questions": [],
        }

    if not groups_by_label:
        groups_by_label["Intrebari"] = {
            "code": "L1",
            "title": "Intrebari",
            "questionRange": "",
            "sharedText": "",
            "questions": [],
        }

    for question in payload.get("questions") or []:
        options: dict[str, str] = {}
        selected_key = ""
        correct_key = ""
        for option_index, option_row in enumerate(question.get("option_rows") or []):
            key = _option_key_from_label(option_row.get("label") or "", option_index)
            options[key] = _option_text_from_label(option_row.get("label") or "")
            if option_row.get("is_selected"):
                selected_key = key
            if option_row.get("is_correct"):
                correct_key = key

        status = "Corect" if question.get("is_correct") else "Gresit"
        explanation = (
            question.get("explanation")
            or question.get("explanationText")
            or question.get("feedback")
            or question.get("justification")
            or None
        )
        normalized_question = {
            "number": question.get("index"),
            "section": question.get("lesson") or "",
            "text": question.get("question_text") or "",
            "options": options,
            "selected": selected_key or clean_text(question.get("selected_answer") or ""),
            "correct": correct_key or clean_text(question.get("correct_answer") or ""),
            "status": status,
            "explanation": explanation,
        }
        label = clean_text(question.get("lesson") or "")
        target_group = groups_by_label.get(label) or next(iter(groups_by_label.values()))
        target_group["questions"].append(normalized_question)

    return {
        "studentName": payload.get("student_name") or "Elev",
        "candidateName": payload.get("student_name") or "Elev",
        "testTitle": payload.get("test_title") or "Test integrat",
        "reportTitle": "Teste integrate",
        "reportFooterLabel": "teste integrate",
        "reportBackgroundColor": "#EAF2F5",
        "date": (payload.get("submitted_at") or "")[:10] or "-",
        "totalQuestions": total_questions,
        "correctCount": correct_count,
        "wrongCount": max(total_questions - correct_count, 0),
        "score": correct_count,
        "scorePercent": score_percent,
        "percentage": score_percent,
        "duration": format_duration(payload.get("duration_seconds") or 0),
        "radar": radar,
        "groups": [group for group in groups_by_label.values() if group["questions"]],
        "reportTemplate": "a-mentor-integrated",
        "reportTemplateVersion": "v1",
    }


def generate_test_report_pdf_bytes(source: dict) -> bytes:
    payload = normalize_export_payload(source)
    buffer = io.BytesIO()
    build_integrated_pdf_report(source, payload, buffer)
    return buffer.getvalue()


def generate_attempt_pdf_bytes(report_data: dict) -> bytes:
    return generate_test_report_pdf_bytes(report_data)
