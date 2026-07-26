# Workflow BAC din PDF-uri

Acest workflow pastreaza directiile stabilite pentru construirea variantelor BAC din perechi PDF `subiect + barem`, fara schimbari de UI.

## Reguli fixe

- Nu se schimba UI-ul aplicatiei.
- Nu se redeseneaza layout-ul.
- Se genereaza doar continutul si structura logica necesara.
- Fisierele `_BAREM.pdf` sunt tratate ca barem.
- Fisierul-pereche al baremului este acelasi nume fara sufixul `_BAREM`.
- Daca nu exista barem pentru un subiect, varianta se marcheaza cu `has_barem: false`.

## Surse

- Folder BAC: `E:\Side_Work\Economics_Profesor\Logica\Subiecte Bac`

## Metadate obligatorii pentru fiecare varianta

- `variant_id`
- `year`
- `variant_label`
- `title`
- `subtitle`
- `subject_pdf`
- `barem_pdf`
- `has_barem`
- `barem_pages`
- `work_order`
- `sections`

## Structura minima a variantei

```json
{
  "variant_id": "2025_v6",
  "year": "2025",
  "variant_label": "2025 - V6",
  "title": "Examenul national de bacalaureat 2025 - Varianta V6",
  "subtitle": "Subiect oficial, barem oficial si rezolvare explicata pe fiecare item.",
  "subject_pdf": "Examenul national de bacalaureat 2025_V6.pdf",
  "barem_pdf": "Examenul national de bacalaureat 2025_V6_BAREM.pdf",
  "has_barem": true,
  "barem_pages": [
    {
      "label": "Baremul oficial - pagina 1",
      "page_number": 1
    }
  ],
  "work_order": [
    "La fiecare card vezi codul exact al punctului din examen.",
    "Enuntul oficial este afisat separat, clar, nu doar in scan.",
    "Rezolvarea iti arata cum gandesti, nu doar rezultatul final.",
    "Poti verifica oricand baremul oficial din taburile de sus."
  ],
  "sections": [
    {
      "section_id": "subiectul_I",
      "section_title": "Subiectul I",
      "section_points": "30 de puncte",
      "items": []
    },
    {
      "section_id": "subiectul_II",
      "section_title": "Subiectul II",
      "section_points": "30 de puncte",
      "items": []
    },
    {
      "section_id": "subiectul_III",
      "section_title": "Subiectul III",
      "section_points": "30 de puncte",
      "items": []
    }
  ]
}
```

## Structura obligatorie a fiecarui item

```json
{
  "item_id": "string",
  "item_code": "string",
  "points": "string",
  "title": "string",
  "prompt_official": "string",
  "correct_answer": "string",
  "item_type": "string",
  "general_rule": [
    "string"
  ],
  "de_ce_este_corect": "string",
  "cum_gandesti": [
    "string"
  ],
  "schema_logica": {
    "tip": "string",
    "continut": [
      "string"
    ]
  },
  "reprezentare_vizuala": [
    "string"
  ],
  "step_by_step": [
    "string"
  ],
  "de_ce_nu": {
    "a": "string",
    "b": "string",
    "c": "string",
    "d": "string"
  },
  "capcana_frecventa": "string",
  "source_reference": {
    "exam_year": "string",
    "variant": "string",
    "official_item_code": "string",
    "subject_page": "string",
    "barem_page": "string"
  }
}
```

## Limita actuala a automatizarii

- PDF-urile BAC din folder sunt scanate.
- `pypdf` poate citi numarul de pagini, dar nu extrage text util direct din ele.
- Rezulta ca imperecherea, metadatele si skeleton-ul JSON pot fi automatizate acum.
- Descompunerea reala in itemi si rezolvarea pedagogica completa cer OCR sau transcriere asistata.

## Script disponibil

- `scripts/generate_bac_variant_skeletons.py`

Acest script:

- identifica automat perechile subiect-barem
- normalizeaza anul si tipul variantei
- numara paginile din subiect si barem
- genereaza JSON skeleton pentru toate variantele din folder
- marcheaza lipsa baremului prin `has_barem: false`

