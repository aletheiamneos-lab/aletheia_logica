PACHET ADMITERE DREPT – CONȚINUT

1. tests_logica_admitere_drept_v2.json
   - fișierul complet pentru aplicație
   - conține 26 seturi
   - fiecare set are 20 întrebări
   - total 520 întrebări

2. PROMPT_AGENT_VSCODE.txt
   - promptul clar pentru agentul AI din VS Code
   - îl folosești ca să-i ceri să construiască secțiunea Admitere

3. validate_tests_json.js
   - script de validare pentru JSON
   - verifică structura, întrebările, variantele și răspunsurile

4. Probleme Logica_Neformatat.docx
   - sursa brută din care au fost extrase testele
   - îl păstrezi doar ca referință / verificare

CUM FOLOSEȘTI PACHETUL

PASUL 1
Pui fișierul tests_logica_admitere_drept_v2.json în proiect, de exemplu în:
src/data/

PASUL 2
Deschizi fișierul PROMPT_AGENT_VSCODE.txt și îi dai integral promptul agentului AI din VS Code.

PASUL 3
Îi spui agentului să folosească JSON-ul ca sursă de date și să construiască:
- lista testelor
- pagina unui test
- pagina de rezultat

PASUL 4
Dacă vrei să verifici JSON-ul înainte de integrare, rulezi în terminal:
node validate_tests_json.js tests_logica_admitere_drept_v2.json

OBSERVAȚII IMPORTANTE
- JSON-ul conține 1 întrebare de tip multiple-choice; restul sunt single-choice.
- Componenta de quiz trebuie să respecte câmpul answerType.
- În timpul rezolvării nu se afișează răspunsul corect; acesta apare doar după finalizare.
