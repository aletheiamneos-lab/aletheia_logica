from __future__ import annotations

import argparse
import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pypdf import PdfReader

DEFAULT_SOURCE_DIR = Path(r"E:\Side_Work\Economics_Profesor\Logica\Subiecte Bac")
DEFAULT_OUTPUT_PATH = Path("tmp_exam_extract/bac_variant_skeletons.json")
DEFAULT_FRONTEND_OUTPUT_PATH = Path("frontend/src/data/exams/bacExerciseCatalog.json")

DEFAULT_WORK_ORDER = [
    "La fiecare card vezi codul exact al punctului din examen.",
    "Enuntul oficial este afisat separat, clar, nu doar in scan.",
    "Rezolvarea iti arata cum gandesti, nu doar rezultatul final.",
    "Subiectele II si III trebuie sparte in pasi, nu lasate compacte.",
    "Poti verifica oricand baremul oficial din taburile de sus.",
]

SECTION_SKELETON = [
    {
        "section_id": "subiectul_I",
        "section_title": "Subiectul I",
        "section_points": "30 de puncte",
        "items": [],
    },
    {
        "section_id": "subiectul_II",
        "section_title": "Subiectul II",
        "section_points": "30 de puncte",
        "items": [],
    },
    {
        "section_id": "subiectul_III",
        "section_title": "Subiectul III",
        "section_points": "30 de puncte",
        "items": [],
    },
]

VARIANT_PATTERN = re.compile(
    r"(?P<year>20\d{2})_(?P<label>model|simulare|v\d+)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class VariantMeta:
    year: str
    label: str

    @property
    def variant_id(self) -> str:
        return f"{self.year}_{self.label.lower()}"

    @property
    def variant_label(self) -> str:
        return f"{self.year} - {self.label}"

    @property
    def title(self) -> str:
        return f"Examenul national de bacalaureat {self.year} - Varianta {self.label}"


def normalize_ascii(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_only


def normalize_key(value: str) -> str:
    ascii_only = normalize_ascii(value)
    lowered = ascii_only.lower().strip()
    lowered = re.sub(r"\s+", " ", lowered)
    return lowered


def normalize_label(label: str) -> str:
    if label.lower() in {"model", "simulare"}:
        return label.capitalize()
    return label.upper()


def parse_variant_meta(subject_stem: str) -> VariantMeta:
    normalized = normalize_ascii(subject_stem)
    match = VARIANT_PATTERN.search(normalized)

    if not match:
        raise ValueError(f"Nu pot extrage anul si varianta din: {subject_stem}")

    return VariantMeta(
        year=match.group("year"),
        label=normalize_label(match.group("label")),
    )


def pdf_page_count(pdf_path: Path) -> int:
    reader = PdfReader(str(pdf_path))
    return len(reader.pages)


def build_barem_pages(barem_path: Path | None) -> list[dict[str, Any]]:
    if barem_path is None:
        return []

    page_total = pdf_page_count(barem_path)
    return [
        {
            "label": f"Baremul oficial - pagina {page_number}",
            "page_number": page_number,
        }
        for page_number in range(1, page_total + 1)
    ]


def build_variant_json(subject_path: Path, barem_path: Path | None) -> dict[str, Any]:
    meta = parse_variant_meta(subject_path.stem)
    subject_pages = pdf_page_count(subject_path)
    barem_pages = build_barem_pages(barem_path)

    return {
        "variant_id": meta.variant_id,
        "year": meta.year,
        "variant_label": meta.variant_label,
        "title": meta.title,
        "subtitle": "Subiect oficial, barem oficial si rezolvare explicata pe fiecare item.",
        "subject_pdf": subject_path.name,
        "barem_pdf": barem_path.name if barem_path else "",
        "has_barem": barem_path is not None,
        "subject_pages": subject_pages,
        "barem_pages": barem_pages,
        "work_order": list(DEFAULT_WORK_ORDER),
        "sections": [dict(section) for section in SECTION_SKELETON],
    }


def pair_subjects_and_barems(source_dir: Path) -> list[tuple[Path, Path | None]]:
    pdf_files = sorted(source_dir.glob("*.pdf"))
    barem_map: dict[str, Path] = {}
    subjects: list[Path] = []

    for pdf_path in pdf_files:
        stem_key = normalize_key(pdf_path.stem)
        if stem_key.endswith("_barem"):
            barem_key = stem_key[: -len("_barem")]
            barem_map[barem_key] = pdf_path
        else:
            subjects.append(pdf_path)

    pairs: list[tuple[Path, Path | None]] = []
    for subject_path in subjects:
        subject_key = normalize_key(subject_path.stem)
        pairs.append((subject_path, barem_map.get(subject_key)))

    return pairs


def generate_payload(source_dir: Path) -> dict[str, Any]:
    pairs = pair_subjects_and_barems(source_dir)
    variants = [build_variant_json(subject_path, barem_path) for subject_path, barem_path in pairs]

    return {
        "track": "bac",
        "source_dir": str(source_dir),
        "variant_count": len(variants),
        "variants": variants,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genereaza skeleton-uri JSON pentru variantele BAC identificate din perechi PDF subiect-barem.",
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_SOURCE_DIR,
        help="Folderul care contine PDF-urile BAC.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Fisierul JSON in care se salveaza skeleton-urile generate.",
    )
    parser.add_argument(
        "--frontend-output",
        type=Path,
        default=DEFAULT_FRONTEND_OUTPUT_PATH,
        help="Fisierul JSON frontend pentru catalogul de exercitii BAC.",
    )
    args = parser.parse_args()

    if not args.source_dir.exists():
        raise SystemExit(f"Folderul sursa nu exista: {args.source_dir}")

    payload = generate_payload(args.source_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    args.frontend_output.parent.mkdir(parents=True, exist_ok=True)
    args.frontend_output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Am generat {payload['variant_count']} variante in {args.output}")


if __name__ == "__main__":
    main()
