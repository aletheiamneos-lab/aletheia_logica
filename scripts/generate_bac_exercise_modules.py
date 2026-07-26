from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import unicodedata
from concurrent.futures import ProcessPoolExecutor, as_completed
from functools import lru_cache
from itertools import permutations
from pathlib import Path
from typing import Any

import fitz
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

SOURCE_DIR = Path(r"E:\Side_Work\Economics_Profesor\Logica\Subiecte Bac")
PUBLIC_DIR = Path("frontend/public/generated-exams/bac")
OUTPUT_PATH = Path("frontend/src/data/exams/bacGeneratedExerciseModules.json")
OVERRIDES_PATH = Path("scripts/bac_ocr_overrides.json")

WORK_ORDER = [
    "La fiecare card vezi codul exact al punctului din examen.",
    "Subiectul oficial si baremul oficial raman vizibile sus, pagina cu pagina.",
    "Itemii obiectivi se verifica direct in pagina, fara sa iesi din modul.",
    "Cerintele deschise raman separate pe subpuncte, nu compacte intr-un singur bloc.",
]

POINT_LABELS = {
    "ia": "2 puncte",
    "ib1": "2 puncte",
    "ib2": "1 punct",
    "iii_c": "1 punct",
}

VARIANT_PATTERN = re.compile(r"(?P<year>20\d{2})_(?P<label>model|simulare|v\d+)$", re.IGNORECASE)
OPTION_RE = re.compile(r"^([a-dA-D])[\.\)]\s*(.*)$")
OPTION_LABEL_ONLY_RE = re.compile(r"^([a-dA-D])[\.\)]\s*$")
ITEM_RE = re.compile(r"^(\d{1,2})[\.\)]\s*(.*)$")
UPPER_BLOCK_RE = re.compile(r"^([A-E])\.\s*(.*)$")
LOWER_BLOCK_RE = re.compile(r"^([a-h])\)\s*(.*)$")
POINTS_RE = re.compile(r"(\d+)\s+puncte?", re.IGNORECASE)
WORD_RE = re.compile(r"[A-Za-z]+")

CHECKLIST_LABELS = ["a", "b", "c", "d", "e", "f"]
FORMULA_OPTIONS = [("a", "SaP"), ("b", "SeP"), ("c", "SiP"), ("d", "SoP")]
ROMANIAN_STOPWORDS = {
    "si",
    "sau",
    "in",
    "din",
    "la",
    "cu",
    "pe",
    "de",
    "ale",
    "al",
    "ai",
    "ale",
    "un",
    "o",
    "unei",
    "unui",
    "unor",
    "se",
    "sa",
    "sunt",
    "este",
    "fie",
    "fi",
    "prin",
    "care",
    "pentru",
    "cat",
    "cate",
    "cui",
    "ori",
    "toti",
    "toate",
    "unele",
    "unii",
    "niciun",
    "niciunul",
    "aceasta",
    "acesta",
    "acele",
    "aceste",
    "sau",
    "iar",
    "totodata",
    "asadar",
    "deci",
    "devreme",
    "avand",
    "vedere",
    "atunci",
}

VOCAB_SOURCES = [Path("frontend/src/data"), Path("docs")]
VOCAB_SUFFIXES = {".js", ".jsx", ".json", ".txt", ".md", ".py"}
VOCAB_EXCLUDED_FILES = {"bacGeneratedExerciseModules.json"}
SHORT_WORDS = {"a", "e", "i", "o", "si", "in", "de", "cu", "la", "pe", "ca", "al", "ai", "ale"}
COMMON_OCR_WORDS = {
    "fie",
    "urmatorul",
    "silogism",
    "daca",
    "unele",
    "unii",
    "niciun",
    "toate",
    "toti",
    "termenii",
    "termenul",
    "premisa",
    "premisa",
    "premisa",
    "majora",
    "minora",
    "concluzia",
    "concluzie",
    "actiunile",
    "actiuni",
    "umane",
    "voluntare",
    "intentionate",
    "liceu",
    "liceeni",
    "studenti",
    "filosofie",
    "filiera",
    "succes",
    "avand",
    "vedere",
    "intrucat",
    "intrucat",
    "atunci",
    "pentru",
    "propozitii",
    "propozitii",
    "propoziti",
    "propozitie",
    "adevarate",
    "false",
    "stabiliti",
    "pornind",
    "document",
    "raport",
    "incrucisare",
    "contradictie",
    "contrarietate",
    "opozitie",
    "specie",
    "gen",
    "supraordonat",
    "subordonat",
    "totodata",
    "fiind",
    "este",
    "al",
    "corect",
    "corecta",
    "corecte",
    "argument",
    "rationament",
    "demonstratie",
    "diagrame",
    "euler",
    "venn",
}


def normalize_ascii(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return normalized.encode("ascii", "ignore").decode("ascii")


def normalize_key(value: str) -> str:
    lowered = normalize_ascii(value).lower().strip()
    return re.sub(r"\s+", " ", lowered)


def normalize_compact(value: str) -> str:
    return re.sub(r"\s+", "", normalize_ascii(value).lower())


def normalize_label(label: str) -> str:
    if label.lower() in {"model", "simulare"}:
        return label.capitalize()
    return label.upper()


def extract_keywords(text: str) -> set[str]:
    normalized = normalize_ascii(text).lower()
    return {
        word
        for word in WORD_RE.findall(normalized)
        if len(word) >= 3 and word not in ROMANIAN_STOPWORDS
    }


def infer_task_signature(text: str) -> str:
    normalized = normalize_ascii(text).lower()

    if "notati propoziti" in normalized and re.search(r"\b[a-h][\.\)]", normalized):
        return "bundle_true_false"
    if "precizati formula" in normalized or "formulele logice" in normalized:
        return "formula"
    if "conversiune" in normalized or "obversiune" in normalized or "contrapoz" in normalized:
        return "transform"
    if "doi elevi" in normalized and "opineaza" in normalized:
        return "opinions"
    if "schema de inferenta" in normalized or "moduri silogistice" in normalized:
        return "two_modes"
    if "diagramelor venn" in normalized or "diagramelor euler" in normalized or "diagrama" in normalized:
        return "diagram"
    if "definit" in normalized:
        return "definition"
    if "limbaj formal" in normalized and "limbaj natural" in normalized:
        return "formal_natural"
    if "termenul major" in normalized or "premisa minora" in normalized or "premisa majora" in normalized:
        return "silogism_parts"
    if "demonstrat" in normalized:
        return "demonstration"
    return "guided"


def pick_barem_note(
    subject_text: str,
    candidate_blocks: dict[str, dict[str, Any]],
    fallback_block: dict[str, Any],
    preferred_label: str | None = None,
) -> str:
    candidates: list[tuple[str, dict[str, Any], str]] = []

    for label, block in candidate_blocks.items():
        text = join_lines(block.get("lines", []))
        if text:
            candidates.append((label, block, text))

    fallback_text = join_lines(fallback_block.get("lines", []))
    if fallback_text:
        candidates.append(("_fallback", fallback_block, fallback_text))

    if not candidates:
        return ""

    source_keywords = extract_keywords(subject_text)
    source_signature = infer_task_signature(subject_text)
    best_score = float("-inf")
    best_text = fallback_text

    for label, _, candidate_text in candidates:
        candidate_keywords = extract_keywords(candidate_text)
        candidate_signature = infer_task_signature(candidate_text)
        score = 0

        if preferred_label and label == preferred_label:
            score += 4
        if candidate_signature == source_signature:
            score += 12

        overlap = source_keywords & candidate_keywords
        score += len(overlap) * 2

        if "formula" in source_signature and re.search(r"sa\s*p|se\s*p|si\s*p|so\s*p", candidate_text, re.IGNORECASE):
            score += 8
        if source_signature == "opinions" and ("corectitudini" in candidate_text.lower() or "formalizarea" in candidate_text.lower()):
            score += 8
        if source_signature == "transform" and ("conversiune" in candidate_text.lower() or "obvers" in candidate_text.lower()):
            score += 8
        if source_signature == "definition" and "definit" in candidate_text.lower():
            score += 8
        if source_signature == "silogism_parts" and (
            "termenul major" in candidate_text.lower() or "premisa minora" in candidate_text.lower()
        ):
            score += 8
        if source_signature == "two_modes" and "moduri silogistice" in candidate_text.lower():
            score += 8

        if score > best_score:
            best_score = score
            best_text = candidate_text

    return best_text


def extract_section_features(lines: list[str]) -> set[str]:
    text = join_lines(lines)
    normalized = normalize_ascii(text).lower()
    features = set()

    if "moduri silogistice" in normalized or "schema de inferenta" in normalized:
        features.add("two_modes")
    if "conversiune" in normalized or "obversiune" in normalized:
        features.add("transform")
    if "formula propozit" in normalized or "formulele logice" in normalized:
        features.add("formula")
    if "doi elevi" in normalized and "opineaza" in normalized:
        features.add("opinions")
    if "definit" in normalized:
        features.add("definition")
    if "diagramelor venn" in normalized or "diagramelor euler" in normalized or "diagrama" in normalized:
        features.add("diagram")
    if "limbaj formal" in normalized and "limbaj natural" in normalized:
        features.add("formal_natural")
    if "adevarate" in normalized and "false" in normalized:
        features.add("true_false")

    return features


def section_match_score(subject_section: dict[str, Any], barem_section: dict[str, Any]) -> int:
    subject_text = join_lines(subject_section.get("lines", []))
    barem_text = join_lines(barem_section.get("lines", []))
    subject_features = extract_section_features(subject_section.get("lines", []))
    barem_features = extract_section_features(barem_section.get("lines", []))
    subject_keywords = extract_keywords(subject_text)
    barem_keywords = extract_keywords(barem_text)

    score = len(subject_features & barem_features) * 8
    score += len(subject_keywords & barem_keywords)

    if "true_false" in subject_features and re.search(r"[a-h]-[AF]", barem_text, re.IGNORECASE):
        score += 8
    if "formula" in subject_features and re.search(r"sa\s*p|se\s*p|si\s*p|so\s*p", barem_text, re.IGNORECASE):
        score += 8
    if "opinions" in subject_features and ("formalizarea" in barem_text.lower() or "corectitudini" in barem_text.lower()):
        score += 8

    return score


def align_barem_sections(
    subject_sections: dict[str, dict[str, Any]],
    barem_sections: dict[str, dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    relevant_subject_codes = [code for code in ["I", "II", "III"] if code in subject_sections]
    relevant_barem_codes = [code for code in ["I", "II", "III"] if code in barem_sections]

    if len(relevant_subject_codes) < 2 or len(relevant_barem_codes) < 2:
        return barem_sections

    best_mapping = {code: code for code in relevant_subject_codes if code in barem_sections}
    best_score = float("-inf")

    for permutation in permutations(relevant_barem_codes, len(relevant_subject_codes)):
        score = 0
        mapping = {}
        for subject_code, barem_code in zip(relevant_subject_codes, permutation):
            mapping[subject_code] = barem_code
            score += section_match_score(subject_sections[subject_code], barem_sections[barem_code])
            if subject_code == barem_code:
                score += 2

        if score > best_score:
            best_score = score
            best_mapping = mapping

    aligned_sections = dict(barem_sections)
    for subject_code, barem_code in best_mapping.items():
        aligned_sections[subject_code] = barem_sections[barem_code]

    return aligned_sections


@lru_cache(maxsize=1)
def get_spacing_vocabulary() -> set[str]:
    vocabulary = set(COMMON_OCR_WORDS)
    vocabulary.update(SHORT_WORDS)

    for base_dir in VOCAB_SOURCES:
        if not base_dir.exists():
            continue

        for file_path in base_dir.rglob("*"):
            if file_path.suffix.lower() not in VOCAB_SUFFIXES or not file_path.is_file():
                continue
            if file_path.name in VOCAB_EXCLUDED_FILES:
                continue

            try:
                content = normalize_ascii(file_path.read_text(encoding="utf-8", errors="ignore"))
            except OSError:
                continue

            vocabulary.update(
                word.lower()
                for word in WORD_RE.findall(content)
                if len(word) >= 2 or word.lower() in SHORT_WORDS
            )

    return vocabulary


def segment_compound_token(token: str) -> str | None:
    lower_token = token.lower()
    if len(lower_token) < 7 or lower_token in get_spacing_vocabulary():
        return None

    vocabulary = get_spacing_vocabulary()
    max_segment_length = min(len(lower_token), 24)
    best: list[tuple[int, list[tuple[int, int]]]] = [(-1, []) for _ in range(len(lower_token) + 1)]
    best[0] = (0, [])

    for start in range(len(lower_token)):
        current_score, current_path = best[start]
        if current_score < 0:
            continue

        for end in range(start + 1, min(len(lower_token), start + max_segment_length) + 1):
            piece = lower_token[start:end]
            if piece not in vocabulary or (len(piece) == 1 and piece not in SHORT_WORDS):
                continue

            score = current_score + len(piece) * len(piece)
            if best[end][0] < score:
                best[end] = (score, [*current_path, (start, end)])

    final_score, final_path = best[len(lower_token)]
    if final_score < 0 or len(final_path) < 2:
        return None

    if final_score < len(lower_token) + 16:
        return None

    return " ".join(token[start:end] for start, end in final_path)


def normalize_ocr_text(text: str) -> str:
    normalized = normalize_ascii(text)
    normalized = normalized.replace("，", ",").replace("„", '"').replace("”", '"').replace("’", "'")
    normalized = normalized.replace(":,", ":")
    normalized = re.sub(r"([,;:])(?=[A-Za-z])", r"\1 ", normalized)
    normalized = re.sub(r"(?<=[\.\?!])(?=[A-Za-z])", " ", normalized)
    normalized = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", normalized)
    normalized = re.sub(r"\b([A-Z])si(?=[A-Z])", r"\1 si ", normalized)
    normalized = re.sub(r"\b([A-Z])si(?=[a-z])", r"\1 si ", normalized)
    normalized = re.sub(r"\b([A-Z])si\b", r"\1 si", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    tokens = re.split(r"([^A-Za-z]+)", normalized)
    repaired_tokens = []

    for token in tokens:
        if token.isalpha():
            repaired_tokens.append(segment_compound_token(token) or token)
        else:
            repaired_tokens.append(token)

    normalized = "".join(repaired_tokens)
    normalized = re.sub(r"\s+([,;:\.\)])", r"\1", normalized)
    normalized = re.sub(r"([\(\[])\s+", r"\1", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def clean_line(text: str) -> str:
    return normalize_ocr_text(text)


def is_noise_line(text: str) -> bool:
    compact = normalize_compact(text)
    return compact.startswith("ministerul") or compact.startswith("centrulnational") or compact.startswith("probascrisa") or compact.startswith("baremdeevaluare") or compact == ""


def is_points_only_line(text: str) -> bool:
    compact = normalize_compact(text)
    return bool(
        re.fullmatch(r"\(?\d+(?:depuncte|puncte)\)?", compact)
        or re.fullmatch(r"\d+x\d+p=?\d*puncte?", compact)
        or compact == "(30depuncte)"
    )


def preview_title(text: str, max_words: int = 7) -> str:
    cleaned = clean_line(text)
    if not cleaned:
        return "Cerinta"
    cleaned = re.sub(r"^[A-Ea-h0-9\.\)\s-]+", "", cleaned).strip()
    words = cleaned.split()
    snippet = " ".join(words[:max_words]).strip()
    return snippet[:1].upper() + snippet[1:] if snippet else "Cerinta"


def join_lines(lines: list[str]) -> str:
    return "\n".join(clean_line(line) for line in lines if clean_line(line) and not is_noise_line(line) and not is_points_only_line(line)).strip()


def parse_meta(subject_stem: str) -> dict[str, str]:
    match = VARIANT_PATTERN.search(normalize_ascii(subject_stem))
    if not match:
        raise ValueError(f"Nu pot extrage anul si varianta din: {subject_stem}")

    year = match.group("year")
    label = normalize_label(match.group("label"))
    variant_id = f"{year}_{label.lower()}"
    return {
        "year": year,
        "label": label,
        "variant_id": variant_id,
        "slug": f"exercitiu-bac-{variant_id.replace('_', '-')}",
    }


def pair_subjects_and_barems(source_dir: Path) -> list[tuple[Path, Path | None]]:
    pdf_files = sorted(source_dir.glob("*.pdf"))
    barem_map: dict[str, Path] = {}
    subjects: list[Path] = []

    for pdf_path in pdf_files:
        stem_key = normalize_key(pdf_path.stem)
        if stem_key.endswith("_barem"):
            barem_map[stem_key[: -len("_barem")]] = pdf_path
        else:
            subjects.append(pdf_path)

    return [(subject_path, barem_map.get(normalize_key(subject_path.stem))) for subject_path in subjects]


@lru_cache(maxsize=1)
def load_ocr_overrides() -> dict[str, Any]:
    if not OVERRIDES_PATH.exists():
        return {}
    return json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))


def render_page_image(page: fitz.Page, destination: Path, scale: float = 2.0) -> None:
    if destination.exists():
        return

    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="JPEG", quality=72, optimize=True)


def copy_pdf_to_public(source_path: Path, variant_id: str, prefix: str) -> str:
    destination = PUBLIC_DIR / variant_id / f"{prefix}.pdf"
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, destination)
    return f"/generated-exams/bac/{variant_id}/{prefix}.pdf"


def normalize_ocr_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized_entries = []

    for entry in payload.get("entries", []):
        normalized_entries.append({**entry, "text": clean_line(entry["text"])})

    normalized_payload = {
        **payload,
        "entries": normalized_entries,
        "lines": [entry["text"] for entry in normalized_entries if entry["text"]],
    }
    normalized_payload["text"] = "\n".join(normalized_payload["lines"])
    return normalized_payload


def ocr_page(engine: RapidOCR, image_path: Path, page_number: int) -> dict[str, Any]:
    cache_path = image_path.with_suffix(".ocr.json")
    if cache_path.exists():
        return normalize_ocr_payload(json.loads(cache_path.read_text(encoding="utf-8")))

    result, _ = engine(str(image_path), use_cls=False)
    entries = []
    for item in result or []:
        box, text, score = item
        stripped = clean_line(text.strip())
        if not stripped:
            continue
        entries.append(
            {
                "text": stripped,
                "x": float(box[0][0]),
                "y": float(box[0][1]),
                "score": float(score),
                "page_number": page_number,
            }
        )

    entries.sort(key=lambda item: (round(item["y"] / 12), item["x"]))
    payload = {"page_number": page_number, "entries": entries, "lines": [entry["text"] for entry in entries], "text": "\n".join(entry["text"] for entry in entries)}
    normalized_payload = normalize_ocr_payload(payload)
    cache_path.write_text(json.dumps(normalized_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return normalized_payload


def page_refs(pdf_path: Path, variant_id: str, prefix: str, engine: RapidOCR) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    doc = fitz.open(pdf_path)
    refs = []
    pages = []

    for index in range(len(doc)):
        image_path = PUBLIC_DIR / variant_id / f"{prefix}-{index + 1}.jpg"
        render_page_image(doc[index], image_path)
        ocr_payload = ocr_page(engine, image_path, index + 1)
        refs.append({"title": f"{'Subiectul oficial' if prefix == 'subject' else 'Baremul oficial'} - pagina {index + 1}", "src": f"/generated-exams/bac/{variant_id}/{prefix}-{index + 1}.jpg"})
        pages.append(ocr_payload)

    return refs, pages


def build_choice_card(reference: str, marks: str, title: str, prompt_text: str, options: list[tuple[str, str]], correct_answer: str, exercise_type: str = "multiple_choice") -> dict[str, Any]:
    prompt = clean_line(prompt_text) or "Enuntul nu a fost separat complet in textul local al itemului."
    option_payload = [{"value": label.lower(), "label": f"{label.lower()}) {clean_line(text)}"} for label, text in options]
    correct_option = next((entry for entry in option_payload if entry["value"] == correct_answer.lower()), None)

    return {
        "kind": "choice",
        "reference": reference,
        "marks": marks,
        "title": title,
        "prompt": "Alege varianta corecta pe baza enuntului oficial.",
        "officialText": "\n".join([prompt] + [entry["label"] for entry in option_payload]),
        "options": option_payload,
        "correctAnswer": correct_answer.lower(),
        "correctAnswerLabel": correct_option["label"] if correct_option else correct_answer.lower(),
        "correctExplanation": f"Raspunsul corect pentru {reference} este {correct_option['label'] if correct_option else correct_answer.lower()}.",
        "incorrectExplanation": f"Raspunsul corect pentru {reference} este {correct_option['label'] if correct_option else correct_answer.lower()}.",
        "exerciseType": exercise_type,
    }


def build_true_false_card(reference: str, marks: str, title: str, statement: str, correct_answer: str) -> dict[str, Any]:
    correct_label = "A" if correct_answer.upper() == "A" else "F"
    return {
        "kind": "choice",
        "reference": reference,
        "marks": marks,
        "title": title,
        "prompt": "Decide daca enuntul este adevarat sau fals, apoi verifica raspunsul.",
        "officialText": clean_line(statement) or "Enuntul nu a fost separat complet in textul local al itemului.",
        "options": [{"value": "A", "label": "A) Adevarat"}, {"value": "F", "label": "F) Fals"}],
        "correctAnswer": correct_label,
        "correctAnswerLabel": f"{correct_label}) {'Adevarat' if correct_label == 'A' else 'Fals'}",
        "correctExplanation": f"Pentru {reference}, verdictul corect este {correct_label}.",
        "incorrectExplanation": f"Pentru {reference}, verdictul corect este {correct_label}.",
        "exerciseType": "true_false",
    }


def build_guided_card(reference: str, marks: str, title: str, official_text: str, marking_note: str, prompt: str | None = None) -> dict[str, Any]:
    return {
        "kind": "guided",
        "reference": reference,
        "marks": marks,
        "title": title,
        "prompt": prompt or "Lucreaza cerinta dupa enuntul oficial si foloseste reperele din barem pentru verificare.",
        "officialText": official_text.strip() or "Enuntul complet al cerintei ramane disponibil in documentul oficial din partea de sus.",
        "answer": "Repere oficiale de rezolvare",
        "justification": "Cardul pastreaza enuntul oficial si nota de barem in acelasi format comun pentru toate exercitiile.",
        "markingNote": marking_note.strip() or "Consulta baremul oficial din tabul de sus pentru detaliile complete de corectare.",
    }


def build_checklist_card(
    reference: str,
    marks: str,
    title: str,
    official_text: str,
    marking_note: str,
    prompt: str,
    options: list[tuple[str, str]],
    correct_answers: list[str],
    justification: str,
    steps: list[str],
    schema: list[str],
    common_trap: str,
) -> dict[str, Any]:
    return {
        "kind": "checklist",
        "reference": reference,
        "marks": marks,
        "title": title,
        "prompt": prompt,
        "officialText": official_text.strip() or "Enuntul complet ramane disponibil in documentul oficial din partea de sus.",
        "options": [{"value": value, "label": label} for value, label in options],
        "correctAnswers": correct_answers,
        "answer": "Reperele obligatorii au fost selectate corect.",
        "justification": justification,
        "steps": steps,
        "schema": schema,
        "markingNote": marking_note.strip() or "Consulta baremul oficial din tabul de sus pentru detaliile complete de corectare.",
        "commonTrap": common_trap,
    }


def formula_to_choice_label(formula: str) -> str:
    compact = normalize_compact(formula)
    mapping = {
        "sap": "a",
        "sep": "b",
        "sip": "c",
        "sop": "d",
    }
    return mapping.get(compact, "")


def parse_formula_answer_map(note: str) -> dict[str, str]:
    matches = re.findall(r"(\d+)\s*-\s*(S\s*[aeio]\s*P)", note, flags=re.IGNORECASE)
    return {label: re.sub(r"\s+", "", formula) for label, formula in matches}


def extract_numbered_statements_from_text(text: str) -> dict[str, str]:
    matches = list(re.finditer(r"(\d+)[\.\)]\s*", text))
    statements: dict[str, str] = {}

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        content = clean_line(text[start:end].strip(" -:;,.\n"))
        if content:
            statements[match.group(1)] = content

    return statements


def build_formula_bundle_cards(card: dict[str, Any]) -> list[dict[str, Any]] | None:
    formula_map = parse_formula_answer_map(card.get("markingNote", ""))
    if len(formula_map) < 2:
        return None

    proposition_map = extract_numbered_statements_from_text(card.get("officialText", ""))
    cards = []

    for label, formula in formula_map.items():
        answer_value = formula_to_choice_label(formula)
        if not answer_value:
            continue

        proposition_text = proposition_map.get(label, card.get("officialText", ""))
        choice_card = build_choice_card(
            reference=f"{card['reference']}.{label}",
            marks=card["marks"],
            title=f"{card['reference']}.{label} - Formula propozitiei {label}",
            prompt_text=proposition_text,
            options=FORMULA_OPTIONS,
            correct_answer=answer_value,
        )
        choice_card["prompt"] = "Alege forma categorica pentru propozitia indicata."
        choice_card["correctExplanation"] = (
            f"Pentru propozitia {label}, forma corecta este {formula}. Stabilesti mai intai cantitatea si "
            "calitatea enuntului, apoi alegi formula standard."
        )
        choice_card["incorrectExplanation"] = (
            f"Pentru propozitia {label}, baremul indica forma {formula}. Refa distinct analiza cuantorului "
            "si a negatiei."
        )
        choice_card["steps"] = [
            "Citesti doar propozitia ceruta de subiect.",
            "Stabilesti cantitatea prin cuantor.",
            "Stabilesti calitatea prin afirmatie sau negatie.",
            "Alegi forma SaP, SeP, SiP sau SoP care combina corect cele doua trasaturi.",
        ]
        choice_card["schema"] = ["A -> SaP", "E -> SeP", "I -> SiP", "O -> SoP"]
        choice_card["commonTrap"] = "Nu lasa lista intreaga de propozitii sa te abata de la enuntul numerotat cerut."
        choice_card["markingNote"] = card.get("markingNote", "")
        cards.append(choice_card)

    return cards or None


def build_formula_choice_from_guided(card: dict[str, Any]) -> dict[str, Any] | None:
    note = card.get("markingNote", "")
    match = re.search(r":\s*(S\s*[aeio]\s*P)\b", note, flags=re.IGNORECASE)
    if not match:
        return None

    formula = re.sub(r"\s+", "", match.group(1))
    correct_answer = formula_to_choice_label(formula)
    if not correct_answer:
        return None

    choice_card = build_choice_card(
        reference=card["reference"],
        marks=card["marks"],
        title=card["title"],
        prompt_text=card["officialText"],
        options=FORMULA_OPTIONS,
        correct_answer=correct_answer,
    )
    choice_card["prompt"] = "Alege forma categorica obtinuta direct din enuntul cerut."
    choice_card["correctExplanation"] = (
        f"Raspunsul corect este {formula}. Identifici mai intai cantitatea si calitatea propozitiei, apoi alegi forma "
        "A, E, I sau O corespunzatoare."
    )
    choice_card["incorrectExplanation"] = (
        f"Forma ceruta de barem este {formula}. Verifica separat cantitatea (universala/particulara) si calitatea "
        "(afirmativa/negativa), apoi reconstruieste formula."
    )
    choice_card["steps"] = [
        "Citesti propozitia ceruta exact in formularea din subiect.",
        "Stabilesti cantitatea prin cuantor: toti/niciun = universala, unii/unele = particulara.",
        "Stabilesti calitatea: afirmativa sau negativa.",
        "Combinatia celor doua iti da forma SaP, SeP, SiP sau SoP.",
    ]
    choice_card["schema"] = ["A -> SaP", "E -> SeP", "I -> SiP", "O -> SoP"]
    choice_card["commonTrap"] = "Nu confunda tipul cuantorului cu negatia propozitiei. Cantitatea si calitatea trebuie separate."
    choice_card["markingNote"] = card.get("markingNote", "")
    return choice_card


def build_checklist_template(card: dict[str, Any]) -> dict[str, Any]:
    text = "\n".join([card.get("title", ""), card.get("officialText", ""), card.get("markingNote", "")])
    signature = infer_task_signature(text)

    if signature == "two_modes":
        if "venn" in normalize_ascii(text).lower():
            return {
                "prompt": "Selecteaza reperele care trebuie sa apara intr-o verificare corecta prin diagrama Venn.",
                "options": [
                    ("a", "Reprezinti premisele modului in diagrama Venn."),
                    ("b", "Marchezi corect zonele vide si eventualul x existential."),
                    ("c", "Formulezi verdictul de validitate pe baza diagramei."),
                    ("d", "Este suficient sa spui din memorie daca modul este valid."),
                ],
                "correct": ["a", "b", "c"],
                "justification": "La verificarea prin Venn nu ajunge verdictul final. Baremul cere reprezentarea premisei, citirea diagramei si decizia rezultata din desen.",
                "steps": [
                    "Desenezi cele trei cercuri pentru S, P si M.",
                    "Umbresti mai intai zonele vide impuse de premisele universale.",
                    "Marchezi cu x existenta ceruta de premisele particulare.",
                    "Citesti daca diagrama forteaza sau nu concluzia.",
                ],
                "schema": ["premise -> diagrama", "diagrama -> verdict"],
                "trap": "Verdictul nu se puncteaza corect daca nu rezulta din reprezentarea grafica.",
            }

        if "limbaj natural" in normalize_ascii(text).lower():
            return {
                "prompt": "Selecteaza elementele fara de care silogismul construit nu respecta cerinta.",
                "options": [
                    ("a", "Pastrezi schema unuia dintre modurile cerute."),
                    ("b", "Stabilesti clar termenii S, P si M."),
                    ("c", "Redai silogismul in limbaj natural, nu doar formal."),
                    ("d", "Poti schimba figura modului, daca enunturile raman plauzibile."),
                ],
                "correct": ["a", "b", "c"],
                "justification": "Un silogism construit corect trebuie sa respecte schema ceruta si sa fie transpus coerent in limbaj natural, cu termenii fixati corect.",
                "steps": [
                    "Alegi unul dintre modurile mentionate in subiect.",
                    "Fixezi termenii S, P si M.",
                    "Scrii premisele si concluzia in aceeasi figura.",
                    "Verifici daca formularea naturala pastreaza forma logica.",
                ],
                "schema": ["S, P, M", "majora -> minora -> concluzie"],
                "trap": "Trei propozitii adevarate nu formeaza automat un silogism valid daca figura sau modul sunt ratate.",
            }

        return {
            "prompt": "Selecteaza reperele obligatorii pentru scrierea corecta a schemelor de inferenta.",
            "options": [
                ("a", "Identifici figura fiecarui mod silogistic."),
                ("b", "Scrii schema primului mod in ordinea majora-minora-concluzie."),
                ("c", "Scrii schema celui de-al doilea mod in aceeasi ordine logica."),
                ("d", "Este suficient sa notezi doar numele modurilor, fara schema lor."),
            ],
            "correct": ["a", "b", "c"],
            "justification": "Baremul puncteaza explicit schema fiecarui mod. Fara figura corecta si fara ordinea majora-minora-concluzie, raspunsul ramane incomplet.",
            "steps": [
                "Fixezi figura pentru fiecare mod din subiect.",
                "Aplici literele modului pe majora, minora si concluzie.",
                "Verifici pozitia termenului mediu in schema rezultata.",
            ],
            "schema": ["figura + mod -> schema formala"],
            "trap": "Cea mai frecventa eroare este schimbarea figurii, desi literele modului sunt corecte.",
        }

    if signature == "transform":
        return {
            "prompt": "Selecteaza reperele obligatorii pentru o transformare corecta.",
            "options": [
                ("a", "Identifici forma initiala a propozitiei inainte de operatie."),
                ("b", "Aplici exact operatia ceruta: conversiune si/sau obversiune."),
                ("c", "Scrii rezultatul atat in limbaj formal, cat si in limbaj natural, daca subiectul o cere."),
                ("d", "Poti inversa termenii in orice propozitie, fiindca toate se convertesc la fel."),
            ],
            "correct": ["a", "b", "c"],
            "justification": "Conversiunea si obversiunea nu se aplica dupa intuitie. Trebuie sa pornesti de la forma categorica si sa respecti exact operatia ceruta.",
            "steps": [
                "Stabilesti daca propozitia de plecare este A, E, I sau O.",
                "Aplici operatia ceruta doar dupa regula formei respective.",
                "Verifici noua distributie a termenilor.",
                "Redai forma obtinuta si in limbaj natural.",
            ],
            "schema": ["A/E/I/O", "operatie -> forma rezultata"],
            "trap": "Nu toate propozitiile se convertesc valid. Daca sari peste forma initiala, gresesti exact acolo.",
        }

    if signature == "opinions":
        return {
            "prompt": "Selecteaza reperele care trebuie sa apara intr-o analiza corecta a opiniilor X si Y.",
            "options": [
                ("a", "Formalizezi separat rationamentul elevului X."),
                ("b", "Formalizezi separat rationamentul elevului Y."),
                ("c", "Stabilesti pentru fiecare daca transformarea folosita este valida sau nevalida."),
                ("d", "Invoci regula logica relevanta, de exemplu distributia termenilor."),
                ("e", "Este suficient sa spui doar care elev are dreptate, fara justificare."),
            ],
            "correct": ["a", "b", "c", "d"],
            "justification": "Acest tip de cerinta cere doua etape: formalizarea rationamentelor si explicarea corectitudinii lor pe baza regulii logice incalcate sau respectate.",
            "steps": [
                "Transformi fiecare opinie intr-o schema formala.",
                "Identifici operatia logica implicata.",
                "Verifici daca forma obtinuta respecta distributia si regulile operatiei.",
                "Dai verdict separat pentru X si pentru Y.",
            ],
            "schema": ["X -> formula -> verdict", "Y -> formula -> verdict"],
            "trap": "Nu este suficient sa spui valid sau nevalid. Baremul cere si regula logica ce sustine verdictul.",
        }

    if signature == "definition":
        return {
            "prompt": "Selecteaza reperele pe care trebuie sa le acoperi in raspunsul despre definitie.",
            "options": [
                ("a", "Identifici regula de corectitudine incalcata de definitia data."),
                ("b", "Daca subiectul cere, precizezi o alta regula de definire fata de prima."),
                ("c", "Construiesti o definitie care incalca in mod controlat regula indicata."),
                ("d", "Este suficient sa spui ca definitia suna frumos sau urat."),
            ],
            "correct": ["a", "b", "c"],
            "justification": "La definitii nu se puncteaza impresiile stilistice, ci regula logica incalcata si controlul ei in exemplele cerute de subiect.",
            "steps": [
                "Citesc definitia data si observ daca este metaforica, prea larga sau prea ingusta.",
                "Numesc regula de definire relevanta.",
                "Daca se cere, aleg o alta regula si construiesc un contraexemplu potrivit.",
            ],
            "schema": ["regula incalcata", "explicatie", "exemplu controlat"],
            "trap": "Elevii descriu definitia intuitiv, dar omit exact regula logica pe care o cere baremul.",
        }

    if signature == "diagram":
        return {
            "prompt": "Selecteaza reperele obligatorii pentru o rezolvare corecta prin diagrama.",
            "options": [
                ("a", "Desenezi raporturile sau zonele cerute in diagrama."),
                ("b", "Marchezi corect incluziunea, intersectia, opozitia sau contradictia indicate de enunt."),
                ("c", "Citesti concluzia sau verdictul direct din diagrama, nu din intuitie."),
                ("d", "Este suficient sa notezi doar raspunsul final, fara reprezentare."),
            ],
            "correct": ["a", "b", "c"],
            "justification": "Metoda diagramei se puncteaza doar daca reprezentarea este facuta corect si raspunsul rezulta din ea.",
            "steps": [
                "Identific raporturile dintre termeni sau propozitii.",
                "Le transfer in diagrama Euler sau Venn.",
                "Citesc din diagrama exact ce se poate afirma si ce nu.",
            ],
            "schema": ["raporturi -> diagrama -> citire"],
            "trap": "Daca sari peste desen si scrii doar verdictul, pierzi tocmai partea demonstrativa a exercitiului.",
        }

    if signature == "silogism_parts":
        return {
            "prompt": "Selecteaza reperele obligatorii pentru identificarea corecta a structurii silogismului.",
            "options": [
                ("a", "Stabilesti concluzia silogismului."),
                ("b", "Identifici termenii major, minor si mediu dupa pozitia lor in concluzie si premise."),
                ("c", "Numesti exact premisa ceruta de subiect in limbaj natural."),
                ("d", "Termenul major este intotdeauna subiectul concluziei."),
            ],
            "correct": ["a", "b", "c"],
            "justification": "Termenii silogismului se identifica din concluzie: predicatul concluziei este termenul major, subiectul concluziei este termenul minor, iar termenul comun premiselor este termenul mediu.",
            "steps": [
                "Citesc concluzia pentru a fixa S si P.",
                "Caut in premise termenul care nu apare in concluzie: acela este M.",
                "Redau apoi premisa sau termenul cerut exact in forma potrivita.",
            ],
            "schema": ["concluzie -> S/P", "premise -> M"],
            "trap": "Cea mai comuna eroare este inversarea termenului major cu termenul minor.",
        }

    if signature == "demonstration":
        return {
            "prompt": "Selecteaza reperele minime pentru definirea corecta a conceptului cerut.",
            "options": [
                ("a", "Definesti conceptul in limbaj logic, nu doar in limbaj comun."),
                ("b", "Pastrezi formularea clara si neambigua."),
                ("c", "Daca exercitiul cere, legi conceptul de teza, fundament sau procesul demonstrativ."),
                ("d", "Este suficient un exemplu, fara definitie explicita."),
            ],
            "correct": ["a", "b", "c"],
            "justification": "Baremul puncteaza definirea conceptului cerut, nu o parafraza vaga. Raspunsul trebuie sa fie clar, logic si relevant pentru notiunea din programa.",
            "steps": [
                "Identific notiunea ceruta in subiect.",
                "Formulez definitia prin gen proxim si diferenta specifica sau prin caracterizare logica echivalenta.",
                "Elimin formularea metaforica sau pur exemplificativa.",
            ],
            "schema": ["concept -> definitie clara"],
            "trap": "Un exemplu nu tine loc de definitie daca subiectul cere explicit conceptul.",
        }

    return {
        "prompt": "Selecteaza reperele fara de care raspunsul nu acopera cerinta de examen.",
        "options": [
            ("a", "Respecti exact operatia sau relatia logica ceruta de subiect."),
            ("b", "Scrii raspunsul in forma ceruta de examen: formal, natural sau ambele."),
            ("c", "Justifici raspunsul prin regula logica relevanta."),
            ("d", "Este suficient sa copiezi rezultatul final, fara pasii logici."),
        ],
        "correct": ["a", "b", "c"],
        "justification": "Baremul nu puncteaza doar rezultatul final, ci si respectarea operatiei cerute, forma raspunsului si justificarea logica.",
        "steps": [
            "Clarifici ce operatie sau relatie logica cere itemul.",
            "Construiesti raspunsul in forma solicitata.",
            "Verifici daca justificarea ta explica de ce raspunsul este corect.",
        ],
        "schema": ["cerinta -> regula -> raspuns"],
        "trap": "Daca sari direct la rezultat fara regula logica, raspunsul ramane incomplet.",
    }


def build_checklist_from_guided(card: dict[str, Any]) -> dict[str, Any]:
    template = build_checklist_template(card)
    return build_checklist_card(
        reference=card["reference"],
        marks=card["marks"],
        title=card["title"],
        official_text=card["officialText"],
        marking_note=card.get("markingNote", ""),
        prompt=template["prompt"],
        options=template["options"],
        correct_answers=template["correct"],
        justification=template["justification"],
        steps=template["steps"],
        schema=template["schema"],
        common_trap=template["trap"],
    )


def extract_lettered_statements_from_text(text: str, labels: list[str]) -> tuple[str, dict[str, str]]:
    pattern = re.compile(rf"({'|'.join(re.escape(label) for label in labels)})[\.\)]\s*", re.IGNORECASE)
    matches = list(pattern.finditer(text))
    if not matches:
        return clean_line(text), {}

    intro = clean_line(text[: matches[0].start()])
    statements: dict[str, str] = {}

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        content = clean_line(text[start:end].strip(" -:;,.\n"))
        if content:
            statements[match.group(1).lower()] = content

    return intro, statements


def expand_true_false_bundle(card: dict[str, Any]) -> list[dict[str, Any]] | None:
    intro_text, statements = extract_lettered_statements_from_text(card.get("officialText", ""), list("abcdefgh"))
    answers = parse_tf_answer_map(card.get("markingNote", ""), "abcdefgh")
    common_labels = [label for label in list("abcdefgh") if label in statements and label in answers]

    if len(common_labels) < 3:
        return None

    cards: list[dict[str, Any]] = []
    intro_block = intro_text.strip()
    if intro_block:
        intro_card = build_checklist_from_guided(
            {
                **card,
                "reference": f"{card['reference']}.1",
                "title": f"{card['reference']}.1 - Diagrama si raporturile de baza",
                "officialText": intro_block,
            }
        )
        cards.append(intro_card)

    tf_intro = "Stabileste pentru fiecare enunt daca este adevarat sau fals, apoi verifica raspunsul."
    for label in common_labels:
        cards.append(
            build_true_false_card(
                reference=f"{card['reference']}.2.{label}",
                marks="1 punct",
                title=f"Enuntul {label.upper()}",
                statement="\n".join(filter(None, [tf_intro, statements[label]])).strip(),
                correct_answer=answers[label],
            )
        )

    return cards


def upgrade_generated_card(card: dict[str, Any]) -> list[dict[str, Any]]:
    if card.get("kind") == "choice":
        return [card]

    signature = infer_task_signature("\n".join([card.get("title", ""), card.get("officialText", ""), card.get("markingNote", "")]))
    if signature == "bundle_true_false":
        expanded = expand_true_false_bundle(card)
        if expanded:
            return expanded

    if signature == "formula":
        formula_bundle = build_formula_bundle_cards(card)
        if formula_bundle:
            return formula_bundle

        formula_card = build_formula_choice_from_guided(card)
        if formula_card:
            return [formula_card]

    return [build_checklist_from_guided(card)]


def upgrade_generated_sections(sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    upgraded_sections = []

    for section in sections:
        upgraded_cards = []
        for card in section["cards"]:
            upgraded_cards.extend(upgrade_generated_card(card))
        upgraded_sections.append({**section, "cards": upgraded_cards})

    return upgraded_sections


def parse_ia_answer_map(barem_text: str) -> dict[int, str]:
    return {int(number): answer.lower() for number, answer in re.findall(r"(\d+)\s*-\s*([a-d])", barem_text, flags=re.IGNORECASE)}


def parse_tf_answer_map(barem_text: str, labels: str) -> dict[str, str]:
    return {label.lower(): answer.upper() for label, answer in re.findall(rf"([{labels}])\s*-\s*([AF])", barem_text, flags=re.IGNORECASE)}


def parse_numeric_tf_answer_map(barem_text: str) -> dict[str, str]:
    return {label: answer.upper() for label, answer in re.findall(r"(\d+)\s*-\s*([AF])", barem_text, flags=re.IGNORECASE)}


def canonical_section_code(text: str) -> str | None:
    compact = normalize_compact(text)
    if not compact.startswith("subiectul"):
        return None

    tail = compact[len("subiectul") :]
    match = re.match(r"^(?:al|a)?([ilvt]+)(.*)$", tail)
    if not match:
        return None

    roman_raw, rest = match.groups()
    if rest and re.match(r"^[a-z]", rest) and not rest.startswith("lea"):
        return None

    roman = roman_raw.replace("l", "i").replace("t", "i")
    if roman.startswith("iii"):
        return "III"
    if roman.startswith("ii"):
        return "II"
    if roman.startswith("i"):
        return "I"
    return None


def split_document_sections(pages: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    sections: dict[str, dict[str, Any]] = {}
    current: dict[str, Any] | None = None
    section_order = ["I", "II", "III"]

    for page in pages:
        for line in page["lines"]:
            guessed_code = canonical_section_code(line)
            if guessed_code:
                code = guessed_code
                if not sections:
                    code = "I"
                elif code in sections:
                    code = next((entry for entry in section_order if entry not in sections), guessed_code)
                current = {"code": code, "title": f"Subiectul {code}", "lines": [line], "page_numbers": [page["page_number"]]}
                sections[code] = current
                continue

            if current is not None:
                current["lines"].append(line)
                current["page_numbers"].append(page["page_number"])

    return sections


def section_entries(pages: list[dict[str, Any]], page_numbers: list[int]) -> list[dict[str, Any]]:
    wanted = set(page_numbers)
    return [entry for page in pages if page["page_number"] in wanted for entry in page["entries"]]


def split_labeled_blocks(lines: list[str], pattern: re.Pattern[str]) -> tuple[list[str], list[dict[str, Any]]]:
    context: list[str] = []
    blocks: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for raw_line in lines:
        line = clean_line(raw_line)
        if not line or is_noise_line(line):
            continue

        match = pattern.match(line)
        if match:
            if current:
                blocks.append(current)
            current = {"label": match.group(1), "lines": [line]}
            continue

        if current:
            current["lines"].append(line)
        else:
            context.append(line)

    if current:
        blocks.append(current)

    return context, blocks


def split_upper_blocks(lines: list[str]) -> tuple[list[str], list[dict[str, Any]]]:
    return split_labeled_blocks(lines, UPPER_BLOCK_RE)


def split_lower_blocks(lines: list[str]) -> tuple[list[str], list[dict[str, Any]]]:
    return split_labeled_blocks(lines, LOWER_BLOCK_RE)


def split_numbered_blocks(lines: list[str]) -> tuple[list[str], list[dict[str, Any]]]:
    return split_labeled_blocks(lines, ITEM_RE)


def block_map(lines: list[str]) -> tuple[list[str], dict[str, dict[str, Any]]]:
    context, blocks = split_upper_blocks(lines)
    return context, {block["label"].upper(): block for block in blocks}


def extract_points_from_lines(lines: list[str], fallback: str = "") -> str:
    for line in lines:
        match = POINTS_RE.search(line)
        if match:
            value = match.group(1)
            return f"{value} puncte" if value != "1" else "1 punct"
    return fallback


def build_mcq_cards(lines: list[str], answer_map: dict[int, str], reference_prefix: str) -> list[dict[str, Any]]:
    parsed: list[tuple[int, str, list[tuple[str, str]]]] = []
    prompt_lines: list[str] = []
    options: list[tuple[str, str]] = []
    current_number: int | None = None
    pending_option_label: str | None = None
    pending_prompt_for_next_item: list[str] = []

    def flush() -> None:
        nonlocal prompt_lines, options, current_number, pending_option_label
        if current_number is None or not options:
            prompt_lines = []
            options = []
            current_number = None
            pending_option_label = None
            return

        parsed.append((current_number, clean_line(" ".join(prompt_lines)), list(options)))
        prompt_lines = []
        options = []
        current_number = None
        pending_option_label = None

    for raw_line in lines:
        line = clean_line(raw_line)
        if not line or is_noise_line(line) or is_points_only_line(line):
            continue

        item_match = ITEM_RE.match(line)
        if item_match and item_match.group(1).isdigit():
            if current_number is not None and options:
                flush()
            current_number = int(item_match.group(1))
            prompt_lines = [*pending_prompt_for_next_item]
            if item_match.group(2):
                prompt_lines.append(item_match.group(2))
            options = []
            pending_option_label = None
            pending_prompt_for_next_item = []
            continue

        if current_number is None:
            if line.endswith(":") and not line.startswith("A."):
                pending_prompt_for_next_item = [line]
            continue

        option_label_only = OPTION_LABEL_ONLY_RE.match(line)
        if option_label_only:
            pending_option_label = option_label_only.group(1).lower()
            continue

        option_match = OPTION_RE.match(line)
        if option_match:
            label = option_match.group(1).lower()
            text = option_match.group(2).strip()
            if text:
                options.append((label, text))
            else:
                pending_option_label = label
            continue

        if pending_option_label:
            options.append((pending_option_label, line))
            pending_option_label = None
            continue

        if options and len(options) >= 3 and line.endswith(":"):
            pending_prompt_for_next_item = [line]
            flush()
            continue

        if options:
            label, text = options[-1]
            options[-1] = (label, clean_line(f"{text} {line}"))
        else:
            prompt_lines.append(line)

    flush()

    return [
        build_choice_card(
            reference=f"{reference_prefix}.{item_number}",
            marks=POINT_LABELS["ia"],
            title=f"Itemul {item_number}",
            prompt_text=prompt,
            options=item_options,
            correct_answer=answer_map[item_number],
        )
        for item_number, prompt, item_options in parsed
        if item_number in answer_map
    ]


def extract_inline_fragments(text: str, pattern: re.Pattern[str], normalize_label_fn) -> list[tuple[str, str]]:
    matches = list(pattern.finditer(text))
    fragments = []

    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        content = clean_line(text[start:end].strip(" -:;,."))
        if content:
            fragments.append((normalize_label_fn(match.group(1)), content))

    return fragments


def parse_labeled_statements(entries: list[dict[str, Any]], labels: list[str]) -> dict[str, str]:
    matches: dict[str, str] = {}
    pattern = re.compile(rf"({'|'.join(re.escape(label) for label in labels)})\)\s*", re.IGNORECASE)

    for entry in entries:
        for label, content in extract_inline_fragments(entry["text"], pattern, lambda value: value.lower()):
            matches[label] = content

    return matches


def parse_numbered_statements(entries: list[dict[str, Any]], labels: list[str]) -> dict[str, str]:
    matches: dict[str, str] = {}
    pattern = re.compile(rf"({'|'.join(labels)})\.\s*")

    for entry in entries:
        for label, content in extract_inline_fragments(entry["text"], pattern, lambda value: value):
            matches[label] = content

    return matches


def block_text(section_context: list[str], block_context: list[str], block_lines: list[str], parent_header: str | None = None) -> str:
    merged = [*section_context]
    if parent_header:
        merged.append(parent_header)
    merged.extend(block_context)
    merged.extend(block_lines)
    return join_lines(merged)


def build_guided_cards_from_block(section_code: str, block: dict[str, Any], section_context: list[str], barem_note: str, points_fallback: str = "") -> list[dict[str, Any]]:
    if not block.get("lines"):
        return []

    inner_context, lower_blocks = split_lower_blocks(block["lines"][1:])
    if lower_blocks:
        parent_header = block["lines"][0]
        parent_points = extract_points_from_lines(block["lines"], points_fallback)
        return [
            build_guided_card(
                f"{section_code}.{block['label'].upper()}.{lower_block['label'].lower()}",
                parent_points,
                f"{section_code}.{block['label'].upper()}.{lower_block['label'].lower()} - {preview_title(lower_block['lines'][0])}",
                block_text(section_context, inner_context, lower_block["lines"], parent_header=parent_header),
                barem_note,
            )
            for lower_block in lower_blocks
        ]

    reference = f"{section_code}.{block['label'].upper()}"
    return [
        build_guided_card(
            reference,
            extract_points_from_lines(block["lines"], points_fallback),
            f"{reference} - {preview_title(block['lines'][0])}",
            block_text(section_context, [], block["lines"]),
            barem_note,
        )
    ]


def legacy_sections(subject_pages: list[dict[str, Any]], barem_pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    subject_sections = split_document_sections(subject_pages)
    barem_sections = align_barem_sections(subject_sections, split_document_sections(barem_pages))

    section_i = subject_sections.get("I", {"lines": []})
    barem_i = barem_sections.get("I", {"lines": []})

    _, subject_i_blocks = block_map(section_i["lines"][1:])
    _, barem_i_blocks = block_map(barem_i["lines"][1:])

    sec_i_cards = build_mcq_cards(subject_i_blocks.get("A", {"lines": []})["lines"], parse_ia_answer_map(join_lines(barem_i.get("lines", []))), "I.A")
    sec_i_b_block = subject_i_blocks.get("B", {"label": "B", "lines": []})
    sec_i_b_cards = build_guided_cards_from_block(
        "I",
        sec_i_b_block,
        [],
        pick_barem_note(join_lines(sec_i_b_block.get("lines", [])), barem_i_blocks, barem_i, preferred_label="B"),
    )

    sections = [
        {
            "id": "subiect-i-a",
            "title": "Subiectul I.A - Itemi grila",
            "points": "Itemi cu raspuns unic",
            "overview": "Itemii obiectivi sunt desfacuti unul cate unul, cu variantele de raspuns si cheia oficiala din barem.",
            "cards": sec_i_cards,
        },
        {
            "id": "subiect-i-b",
            "title": "Subiectul I.B - Cerinte deschise",
            "points": extract_points_from_lines(subject_i_blocks.get("B", {"lines": []})["lines"], "Cerinte deschise"),
            "overview": "Cerinta deschisa ramane impartita pe subpuncte, cu enuntul oficial si nota de barem in acelasi card.",
            "cards": sec_i_b_cards,
        },
    ]

    for section_code in ["II", "III"]:
        if section_code not in subject_sections:
            continue

        section_context, subject_blocks = block_map(subject_sections[section_code]["lines"][1:])
        _, barem_blocks = block_map(barem_sections.get(section_code, {"lines": []})["lines"][1:])
        barem_section = barem_sections.get(section_code, {"lines": []})

        if not subject_blocks:
            numbered_context, numbered_blocks = split_numbered_blocks(subject_sections[section_code]["lines"][1:])
            for numbered_block in numbered_blocks:
                block_context, lower_blocks = split_lower_blocks(numbered_block["lines"][1:])
                if lower_blocks:
                    cards = [
                        build_guided_card(
                            f"{section_code}.{numbered_block['label']}.{lower_block['label'].lower()}",
                            extract_points_from_lines(numbered_block["lines"], "Cerinta deschisa"),
                            f"{section_code}.{numbered_block['label']}.{lower_block['label'].lower()} - {preview_title(lower_block['lines'][0])}",
                            block_text(numbered_context, block_context, lower_block["lines"], parent_header=numbered_block["lines"][0]),
                            join_lines(barem_section.get("lines", [])),
                        )
                        for lower_block in lower_blocks
                    ]
                else:
                    cards = [
                        build_guided_card(
                            f"{section_code}.{numbered_block['label']}",
                            extract_points_from_lines(numbered_block["lines"], "Cerinta deschisa"),
                            f"{section_code}.{numbered_block['label']} - {preview_title(numbered_block['lines'][0])}",
                            block_text(numbered_context, [], numbered_block["lines"]),
                            join_lines(barem_section.get("lines", [])),
                        )
                    ]

                sections.append(
                    {
                        "id": f"subiect-{section_code.lower()}-{numbered_block['label']}",
                        "title": f"Subiectul {section_code}.{numbered_block['label']} - {preview_title(numbered_block['lines'][0])}",
                        "points": extract_points_from_lines(numbered_block["lines"], "Cerinta deschisa"),
                        "overview": "Cerinta este pastrata textual si poate fi lucrata direct din pagina, fara sa iesi din formatul comun al exercitiilor.",
                        "cards": cards,
                    }
                )
            continue

        for label in ["A", "B", "C", "D", "E"]:
            block = subject_blocks.get(label)
            if not block:
                continue

            cards = build_guided_cards_from_block(
                section_code,
                block,
                section_context,
                pick_barem_note(join_lines(block.get("lines", [])), barem_blocks, barem_section, preferred_label=label),
            )
            sections.append(
                {
                    "id": f"subiect-{section_code.lower()}-{label.lower()}",
                    "title": f"Subiectul {section_code}.{label} - {preview_title(block['lines'][0])}",
                    "points": extract_points_from_lines(block["lines"], "Cerinta deschisa"),
                    "overview": "Cerinta este pastrata textual si poate fi lucrata direct din pagina, fara sa iesi din formatul comun al exercitiilor.",
                    "cards": cards,
                }
            )

    return [section for section in sections if section["cards"]]


def modern_sections(subject_pages: list[dict[str, Any]], barem_pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    subject_sections = split_document_sections(subject_pages)
    barem_sections = align_barem_sections(subject_sections, split_document_sections(barem_pages))

    section_i = subject_sections.get("I", {"lines": [], "page_numbers": []})
    section_ii = subject_sections.get("II", {"lines": [], "page_numbers": []})
    section_iii = subject_sections.get("III", {"lines": [], "page_numbers": []})
    barem_i = barem_sections.get("I", {"lines": []})
    barem_ii = barem_sections.get("II", {"lines": []})
    barem_iii = barem_sections.get("III", {"lines": []})

    _, i_blocks = block_map(section_i["lines"][1:])
    _, i_barem_blocks = block_map(barem_i["lines"][1:])
    ia_cards = build_mcq_cards(i_blocks.get("A", {"lines": []})["lines"], parse_ia_answer_map(join_lines(i_barem_blocks.get("A", barem_i).get("lines", []))), "I.A")

    i_entries = section_entries(subject_pages, section_i.get("page_numbers", []))
    ib_block = i_blocks.get("B", {"label": "B", "lines": []})
    ib_context, ib_number_blocks = split_numbered_blocks(ib_block["lines"][1:])
    ib_number_map = {block["label"]: block for block in ib_number_blocks}
    ib_barem_note = pick_barem_note(join_lines(ib_block.get("lines", [])), i_barem_blocks, barem_i, preferred_label="B")
    ib1_text = block_text([], ib_context, ib_number_map.get("1", {"lines": []})["lines"], parent_header=ib_block["lines"][0] if ib_block["lines"] else None)
    ib2_intro = block_text([], ib_context, ib_number_map.get("2", {"lines": []})["lines"][:1], parent_header=ib_block["lines"][0] if ib_block["lines"] else None)
    ib2_statements = parse_labeled_statements(i_entries, list("abcdefgh"))
    ib2_answers = parse_tf_answer_map(join_lines(i_barem_blocks.get("B", barem_i).get("lines", [])), "abcdefgh")
    ib2_cards = [
        build_true_false_card(f"I.B.2.{label}", POINT_LABELS["ib2"], f"Enuntul {label.upper()}", "\n".join([ib2_intro, ib2_statements.get(label, "Verifica enuntul in scanul oficial de sus.")]).strip(), ib2_answers.get(label, "F"))
        for label in list("abcdefgh")
    ]

    section_ii_context, ii_blocks = block_map(section_ii["lines"][1:])
    _, ii_barem_blocks = block_map(barem_ii["lines"][1:])
    section_iii_context, iii_blocks = block_map(section_iii["lines"][1:])
    _, iii_barem_blocks = block_map(barem_iii["lines"][1:])

    iii_entries = section_entries(subject_pages, section_iii.get("page_numbers", []))
    iiic_answers = parse_numeric_tf_answer_map(join_lines(iii_barem_blocks.get("C", barem_iii).get("lines", [])))
    iiic_statements = parse_numbered_statements(iii_entries, ["1", "2", "3", "4"])
    iiic_prompt = block_text(section_iii_context, [], iii_blocks.get("C", {"lines": []})["lines"][:1])
    iiic_cards = [
        build_true_false_card(f"III.C.{label}", POINT_LABELS["iii_c"], f"Enuntul {label}", "\n".join([iiic_prompt, iiic_statements.get(label, "Verifica enuntul in scanul oficial de sus.")]).strip(), iiic_answers.get(label, "F"))
        for label in ["1", "2", "3", "4"]
    ]

    sections = [
        {
            "id": "subiect-i-a",
            "title": "Subiectul I.A - Itemi grila",
            "points": "20 de puncte",
            "overview": "Fiecare item este verificabil direct in pagina, cu variantele de raspuns si cheia oficiala din barem.",
            "cards": ia_cards,
        },
        {
            "id": "subiect-i-b-1",
            "title": "Subiectul I.B.1 - Diagrama Euler",
            "points": POINT_LABELS["ib1"],
            "overview": "Cerinta de diagrama ramane separata, cu scanul oficial si cu nota de barem atasata aceluiasi card.",
            "cards": [build_guided_card("I.B.1", POINT_LABELS["ib1"], "I.B.1 - Diagrama Euler", ib1_text, ib_barem_note)],
        },
        {
            "id": "subiect-i-b-2",
            "title": "Subiectul I.B.2 - Enunturi adevarat sau fals",
            "points": "8 puncte",
            "overview": "Fiecare enunt este tratat separat, cu verdict A/F verificat direct in modul.",
            "cards": ib2_cards,
        },
    ]

    for label in ["A", "B", "C", "D"]:
        block = ii_blocks.get(label)
        if not block:
            continue
        sections.append(
            {
                "id": f"subiect-ii-{label.lower()}",
                "title": f"Subiectul II.{label} - {preview_title(block['lines'][0])}",
                "points": extract_points_from_lines(block["lines"], "Cerinta deschisa"),
                "overview": "Cerinta este pastrata textual, cu contextul complet din subiect si nota de barem in acelasi loc.",
                "cards": build_guided_cards_from_block(
                    "II",
                    block,
                    section_ii_context,
                    pick_barem_note(join_lines(block.get("lines", [])), ii_barem_blocks, barem_ii, preferred_label=label),
                ),
            }
        )

    for label in ["A", "B", "D"]:
        block = iii_blocks.get(label)
        if not block:
            continue
        sections.append(
            {
                "id": f"subiect-iii-{label.lower()}",
                "title": f"Subiectul III.{label} - {preview_title(block['lines'][0])}",
                "points": extract_points_from_lines(block["lines"], "Cerinta deschisa"),
                "overview": "Cerinta este desfacuta pe subpuncte si ramane lucrabila direct din pagina, fara sa se piarda contextul formal.",
                "cards": build_guided_cards_from_block(
                    "III",
                    block,
                    section_iii_context,
                    pick_barem_note(join_lines(block.get("lines", [])), iii_barem_blocks, barem_iii, preferred_label=label),
                ),
            }
        )

    if iiic_cards:
        sections.append(
            {
                "id": "subiect-iii-c",
                "title": "Subiectul III.C - Enunturi adevarat sau fals",
                "points": "4 puncte",
                "overview": "Fiecare enunt este verificabil direct in modul, cu verdictul oficial din barem.",
                "cards": iiic_cards,
            }
        )

    return [section for section in sections if section["cards"]]


def build_sections(subject_pages: list[dict[str, Any]], barem_pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    subject_sections = split_document_sections(subject_pages)
    has_all_three = {"I", "II", "III"}.issubset(set(subject_sections))
    i_entries = section_entries(subject_pages, subject_sections.get("I", {}).get("page_numbers", []))
    has_modern_truth_table = len(parse_labeled_statements(i_entries, list("abcdefgh"))) >= 6
    return modern_sections(subject_pages, barem_pages) if has_all_three and has_modern_truth_table else legacy_sections(subject_pages, barem_pages)


def apply_card_overrides(module_slug: str, sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    overrides = load_ocr_overrides().get(module_slug, {})
    if not overrides:
        return sections

    patched_sections = []
    for section in sections:
        patched_cards = []
        for card in section["cards"]:
            reference = card.get("reference")
            if reference and reference in overrides:
                patched_cards.append({**card, **overrides[reference]})
            else:
                patched_cards.append(card)
        patched_sections.append({**section, "cards": patched_cards})

    return patched_sections


def build_module(subject_path: Path, barem_path: Path | None) -> dict[str, Any]:
    engine = RapidOCR()
    meta = parse_meta(subject_path.stem)
    subject_refs, subject_pages = page_refs(subject_path, meta["variant_id"], "subject", engine)
    barem_refs, barem_pages = (page_refs(barem_path, meta["variant_id"], "barem", engine) if barem_path else ([], []))
    subject_pdf_src = copy_pdf_to_public(subject_path, meta["variant_id"], "subject")
    barem_pdf_src = copy_pdf_to_public(barem_path, meta["variant_id"], "barem") if barem_path else ""
    slug = meta["slug"]
    sections = upgrade_generated_sections(apply_card_overrides(slug, build_sections(subject_pages, barem_pages)))

    return {
        "id": f"bac-exercise-{meta['variant_id']}",
        "track": "bac",
        "slug": slug,
        "title": f"Exercitiu BAC {meta['year']}, {meta['label']}",
        "subtitle": "Serie oficiala integrata ca exercitiu real, cu itemi verificabili si cu subiectul scanat pastrat in pagina.",
        "intro": "Pagina de exercitiu afiseaza scanul subiectului, baremul oficial si itemii desfacuti in acelasi format comun, astfel incat orice reglaj de stil sau structura sa se aplice uniform tuturor seriilor.",
        "officialPaper": {
            "subjectPages": subject_refs,
            "baremPages": barem_refs,
            "subjectDownload": {
                "href": subject_pdf_src,
                "fileName": subject_path.name,
                "label": "Descarca subiectul PDF",
            },
            "baremDownload": (
                {
                    "href": barem_pdf_src,
                    "fileName": barem_path.name,
                    "label": "Descarca baremul PDF",
                }
                if barem_path
                else None
            ),
        },
        "strategyBullets": list(WORK_ORDER),
        "sections": sections,
        "checkpoints": [],
        "practiceNote": "",
    }


def build_module_task(args: tuple[str, str | None]) -> dict[str, Any]:
    return build_module(Path(args[0]), Path(args[1]) if args[1] else None)


def main() -> None:
    parser = argparse.ArgumentParser(description="Genereaza module BAC de exercitiu din PDF-uri scanate prin OCR.")
    parser.add_argument("--source-dir", type=Path, default=SOURCE_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--workers", type=int, default=max(1, min(4, math.ceil((os.cpu_count() or 1) / 2))))
    args = parser.parse_args()

    pairs = pair_subjects_and_barems(args.source_dir)
    if args.limit > 0:
        pairs = pairs[: args.limit]

    pair_args = [(str(subject_path), str(barem_path) if barem_path else None) for subject_path, barem_path in pairs]

    if args.workers <= 1 or len(pair_args) <= 1:
        modules = [build_module_task(item) for item in pair_args]
    else:
        modules = []
        with ProcessPoolExecutor(max_workers=args.workers) as executor:
            futures = {executor.submit(build_module_task, item): item[0] for item in pair_args}
            for future in as_completed(futures):
                modules.append(future.result())
        modules.sort(key=lambda module: module["slug"])

    payload = {"track": "bac", "module_count": len(modules), "modules": modules}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Am generat {len(modules)} module in {args.output}")


if __name__ == "__main__":
    main()
