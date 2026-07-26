from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


def extract_docx(docx_path: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    paragraphs_path = output_dir / "document_paragraphs.txt"
    media_dir = output_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(docx_path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
        namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

        paragraphs = []
        for paragraph in root.findall(".//w:p", namespace):
            text = "".join(node.text or "" for node in paragraph.findall(".//w:t", namespace)).strip()
            if text:
                paragraphs.append(text)

        paragraphs_path.write_text("\n".join(paragraphs), encoding="utf-8")

        media_files = []
        for name in archive.namelist():
            if not name.startswith("word/media/"):
                continue

            target = media_dir / Path(name).name
            target.write_bytes(archive.read(name))
            media_files.append(target.name)

    (output_dir / "media_list.json").write_text(
        json.dumps(media_files, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrage textul si media din cursul DOCX de logica.")
    parser.add_argument("docx_path", type=Path, help="Calea catre fisierul .docx sursa.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("tmp_docx_extract"),
        help="Folderul in care se salveaza textul si media extrase.",
    )
    args = parser.parse_args()

    extract_docx(args.docx_path, args.output_dir)
    print(f"Continut extras in: {args.output_dir.resolve()}")


if __name__ == "__main__":
    main()
