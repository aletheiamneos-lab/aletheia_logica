# Admitere package integration

This project now includes the full local package used for the "Admitere - Logica" module.

## Runtime source

- Interactive tests use `frontend/src/data/admitere/tests_logica_admitere_drept_v2.json`.
- The file is copied unchanged from the package archive and remains the single source of truth for questions and answers.
- `frontend/src/data/admitere/admitereDisplayOverrides.json` completes 4 blank display options found in the JSON, using the DOCX source as reference. The JSON itself is not edited.

## Package references kept in repo

- `docs/sources/admitere_drept_package/tests_logica_admitere_drept_v2.json`
- `docs/sources/admitere_drept_package/PROMPT_AGENT_VSCODE.txt`
- `docs/sources/admitere_drept_package/README.txt`
- `docs/sources/admitere_drept_package/validate_tests_json.js`
- `docs/sources/admitere_drept_package/Probleme Logica_Neformatat.docx`

## Validation

Run:

```powershell
node scripts\validate_admitere_tests.js
```

Optional custom path:

```powershell
node scripts\validate_admitere_tests.js path\to\tests_logica_admitere_drept_v2.json
```

## UI rules implemented from package prompt

- `/admitere` lists all sets from the JSON package.
- Each set opens on its own dedicated page.
- Correct answers stay hidden during the solve flow.
- Finalization computes score, percentage, and per-question feedback.
- `answerType = "multiple"` is corrected with exact-match logic.
- Unanswered items are treated as wrong after finalization.
