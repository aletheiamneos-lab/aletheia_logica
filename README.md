# Logica

Aplicatie educationala locala pentru invatarea logicii, construita cu React + Vite in frontend si FastAPI + SQLite in backend.

## Module principale

- `Acasa`
- `Lectii`
- `Learning 2.0`
- `BAC`
- `Admitere`
- `Exersare`
- `Teste integrate`

## Noutati integrate

### 1. Acces pe roluri

La intrare, utilizatorul alege unul dintre cele doua moduri:

- `Elev`
  - introduce `prenume` si `nume`
  - intra in interfata obisnuita a aplicatiei
- `Profesor`
  - introduce parola
  - parola implicita initiala este `NihilSineDeo`
  - dupa autentificare primeste acces la administrare, monitorizare si raportare

Pe toate paginile autentificate exista un badge fix in coltul stanga-jos:

- elev: afiseaza initialele + nume complet + rol + logout
- profesor: afiseaza badge-ul de profesor + rol + acces la `Setari acces` + logout

### 2. Setari acces profesor

Ruta dedicata: `/setari-acces`

Profesorul poate schimba parola direct din aplicatie:

- parola curenta
- parola noua
- confirmare parola noua

Parola este salvata persistent local in SQLite. Daca nu exista una salvata, se foloseste parola implicita `NihilSineDeo`.

### 3. Teste integrate

Pagina veche `Progres` a fost inlocuita cu noua pagina:

- `/teste-integrate`

Ruta veche:

- `/progres`

redirectioneaza acum automat catre `/teste-integrate`.

#### Flux elev

Elevul poate:

- vedea testele publicate
- porni sau continua un test
- raspunde intrebare cu intrebare
- naviga intre itemi
- vedea timpul si progresul
- trimite testul prin `Submit`

Elevul nu vede raspunsurile corecte in timpul rezolvarii.

#### Flux profesor

Profesorul vede tot ce vede elevul, plus:

- creare test
- editare draft
- publicare test
- cheie de corectare
- monitorizare live
- rezultate locale
- comentariu profesor
- regenerare PDF
- export PDF / JSON / HTML
- export centralizat CSV
- arhiva locala

## Structura testelor integrate

Fiecare test publicabil are exact:

- `25` de intrebari
- `5` intrebari pentru fiecare lectie `1..5`

Campuri principale test:

- `id`
- `title`
- `slug`
- `description`
- `duration_minutes`
- `difficulty_label`
- `is_active`
- `is_draft`
- `created_at`
- `updated_at`
- `total_questions`
- `lesson_structure`

Campuri principale intrebare:

- `id`
- `test_id`
- `lesson_number`
- `lesson_label`
- `text`
- `options` cu exact `4` variante
- `correct_option_index`
- `explanation`
- `difficulty`
- `order_in_lesson`
- `order_in_test`

Un test incomplet ramane draft si nu poate fi publicat pentru elevi.

## Raportare locala

Dupa submit, sistemul:

1. salveaza raspunsurile
2. corecteaza testul
3. calculeaza scorul total si scorurile pe lectii
4. genereaza raportul editabil
5. genereaza PDF-ul
6. arhiveaza local fisierele

Pentru fiecare incercare finalizata se pastreaza:

- raspunsurile brute in SQLite
- sursa editabila JSON
- sursa editabila HTML
- PDF generat

Numele PDF-ului urmeaza structura:

- `NUME_PRENUME_NUME_TEST.pdf`

## Monitorizare live

Profesorul are un panou live in pagina `Teste integrate` unde vede:

- nume elev
- test activ
- status
- numar de intrebari completate
- procent progres
- timp scurs
- ultima activitate
- marker personalizat sau fallback pe initiale
- grafic de evolutie in timp

## Persistenta locala

Datele sunt pastrate local in:

- baza de date: `backend/data/logic_app.db`
- definitii teste: `backend/data/integrated_testing/definitions/`
- rapoarte JSON: `backend/data/integrated_testing/reports/json/`
- rapoarte HTML: `backend/data/integrated_testing/reports/html/`
- PDF-uri: `backend/data/integrated_testing/reports/pdf/`
- exporturi CSV: `backend/data/integrated_testing/exports/`

## Modul Admitere

Ruta principala este `/admitere`.

Sunt integrate 26 de seturi din:

- `frontend/src/data/admitere/tests_logica_admitere_drept_v2.json`

Documentatie locala:

- `docs/admitere-package.md`
- `docs/sources/admitere_drept_package/`

Validator local:

```powershell
node scripts\validate_admitere_tests.js
```

## API principal

### Continut existent

- `GET /lessons`
- `GET /lessons/{lesson_id}`
- `GET /exercises`
- `GET /exercises/by-lesson/{lesson_id}`
- `POST /submit-answer`
- `GET /progress/summary`

### Autentificare si acces

- `POST /auth/student-login`
- `POST /auth/teacher-login`
- `GET /auth/session`
- `POST /auth/logout`
- `POST /auth/change-password`

### Teste integrate

- `GET /integrated-tests`
- `GET /integrated-tests/template`
- `POST /integrated-tests`
- `GET /integrated-tests/{test_id}`
- `GET /integrated-tests/{test_id}/answer-key`
- `PUT /integrated-tests/{test_id}`
- `POST /integrated-tests/{test_id}/publish`
- `POST /integrated-tests/attempts/start`
- `PUT /integrated-tests/attempts/{attempt_id}/progress`
- `POST /integrated-tests/attempts/{attempt_id}/submit`
- `GET /integrated-tests/attempts/{attempt_id}/report`
- `PUT /integrated-tests/attempts/{attempt_id}/comment`
- `GET /integrated-tests/attempts/{attempt_id}/download/{file_kind}`
- `GET /integrated-tests/teacher/results`
- `GET /integrated-tests/teacher/live`
- `GET /integrated-tests/teacher/archive`
- `PUT /integrated-tests/teacher/markers/{student_key}`
- `GET /integrated-tests/teacher/export/centralized`

## Rulare in dezvoltare

### Backend

```powershell
cd e:\Side_Work\Logica_Aplicatie
py -m venv .venv
.venv\Scripts\activate
python -m pip install -r backend\requirements.txt
python -m playwright install chromium
uvicorn app.main:app --reload --app-dir backend
```

### Frontend

```powershell
cd e:\Side_Work\Logica_Aplicatie\frontend
npm install
npm run dev
```

## Lansare locala rapida

- `start-local.bat`
- `start-lan.bat`

FastAPI serveste atat API-ul, cat si build-ul frontend din `frontend/dist`.

## Verificari utile

```powershell
cd e:\Side_Work\Logica_Aplicatie\frontend
npm run lint
npm run build
```

```powershell
cd e:\Side_Work\Logica_Aplicatie
node scripts\validate_admitere_tests.js
```

## Deploy backend pe Render

Configuratia recomandata este versionata in `render.yaml` si foloseste
`Dockerfile`, bazat pe imaginea oficiala Playwright Python. Imaginea include
Chromium si toate bibliotecile Linux necesare. Pentru serviciul Render existent,
selecteaza runtime-ul Docker si calea `./Dockerfile`.

Daca pastrezi temporar runtime-ul Python nativ, foloseste:

```bash
# Build Command
bash render-build.sh

# Start Command
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT
```

Build-ul instaleaza dependentele Python si browserul Chromium compatibil cu
versiunea Playwright folosita de backend. Varianta Docker ramane recomandata,
deoarece reproduce exact dependentele de sistem Chromium pe Render.

Inainte de primul deploy al versiunii fara SQLite:

1. Ruleaza in Supabase SQL Editor
   `supabase/migrations/20260728_migrate_legacy_sqlite_state.sql`.
2. Verifica datele locale fara sa scrii in Supabase:

   ```powershell
   .venv\Scripts\python.exe backend\scripts\migrate_legacy_sqlite_state_to_supabase.py
   ```

3. Transfera datele:

   ```powershell
   .venv\Scripts\python.exe backend\scripts\migrate_legacy_sqlite_state_to_supabase.py --apply
   ```

Scriptul este idempotent si transfera setarile aplicatiei, sesiunile,
progresul lectiilor/exercitiilor si toate datele din monitorizarea publica.
