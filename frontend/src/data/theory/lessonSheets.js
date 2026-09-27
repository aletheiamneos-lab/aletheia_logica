// Fișele de fixare construite direct în lecție (înlocuiesc posterele-imagine).
// Fiecare fișă e o listă de rânduri; un rând are unul sau mai multe blocuri.

export const lessonSheets = {
  notiuneaTermenulLogic: {
    rows: [
      {
        columns: "minmax(0,1fr) minmax(0,1fr)",
        blocks: [
          {
            type: "definition",
            number: 1,
            title: "Definiție",
            tone: "green",
            text: "Noțiunea este **forma logică** prin care gândim obiecte, ființe, fenomene sau clase de obiecte prin **însușirile lor esențiale**.",
          },
          {
            type: "pair",
            number: 2,
            title: "Componente",
            tone: "green",
            items: [
              { term: "Conținut", tone: "green", text: "totalitatea **însușirilor esențiale** ale noțiunii" },
              { term: "Sferă", tone: "blue", text: "totalitatea **obiectelor** la care se referă noțiunea" },
            ],
          },
        ],
      },
      {
        type: "rule",
        number: 3,
        title: "Regulă esențială",
        tone: "red",
        text: "Când **conținutul crește**, sfera **scade**; când **conținutul scade**, sfera **crește**.",
      },
      {
        type: "ladder",
        number: 4,
        title: "Exemplu: scara noțiunilor",
        tone: "green",
        caption: "Cu cât coborâm, adăugăm însușiri (conținut mai bogat) și rămân mai puține obiecte (sferă mai mică).",
        steps: [
          { term: "ființă", content: "are existență; este ceva real.", sphere: "cea mai mare", dots: 40 },
          { term: "om", content: "ființă rațională, cu conștiință și liber arbitru.", sphere: "medie", dots: 13 },
          { term: "elev", content: "om care urmează o formă de învățământ.", sphere: "cea mai mică", dots: 4 },
        ],
      },
      {
        type: "relations",
        number: 5,
        title: "Raporturi între noțiuni",
        tone: "green",
        items: [
          { kind: "identitate", name: "Identitate", example: "triunghi = figură cu trei laturi" },
          { kind: "subordonare", name: "Subordonare", example: "mamifer (A) – câine (B)" },
          { kind: "incrucisare", name: "Încrucișare", example: "scriitor (A) și profesor (B)" },
          { kind: "contrarietate", name: "Contrarietate", example: "drept (A) și nedrept (B)" },
          { kind: "contradictie", name: "Contradicție", example: "viu (A) și neviu (non-A)" },
        ],
      },
    ],
    keyQuestion: "La ce se referă noțiunea și prin ce însușiri o recunoaștem?",
  },

  clasificareaSiDiviziunea: {
    rows: [
      {
        columns: "minmax(0,0.8fr) minmax(0,1.3fr) minmax(0,1fr)",
        blocks: [
          {
            type: "pair",
            title: "Două operații",
            tone: "green",
            items: [
              { term: "A clasifica", tone: "green", text: "înseamnă a **grupa** obiectele după un criteriu comun." },
              { term: "A diviza", tone: "blue", text: "înseamnă a **împărți** o noțiune în specii sau clase." },
            ],
          },
          {
            type: "tree",
            title: "Exemplu: arbore de clasificare",
            root: "Fructe",
            criterion: "tipul de fruct",
            branches: [
              { label: "citrice", examples: "portocală" },
              { label: "sâmburoase", examples: "caisă" },
              { label: "semințoase", examples: "măr" },
            ],
          },
          {
            type: "list",
            title: "Reguli importante",
            tone: "red",
            items: [
              "se folosește **un singur criteriu**",
              "clasele **se exclud reciproc**",
              "împărțirea trebuie să fie **completă**",
              "ordinea trebuie să fie **clară**",
            ],
          },
        ],
      },
      {
        type: "compare",
        good: {
          title: "Exemplu bun",
          root: "Elevi",
          criterion: "după nivel",
          parts: ["gimnaziu", "liceu"],
          verdict: "Un singur criteriu, clase care nu se suprapun.",
        },
        bad: {
          title: "Exemplu greșit",
          root: "Elevi",
          parts: ["silitori", "înalți", "clasa a IX-a"],
          verdict: "Criterii amestecate: același elev poate fi în toate trei.",
        },
      },
      {
        type: "steps",
        title: "Pașii",
        tone: "slate",
        items: ["alegi noțiunea", "stabilești criteriul", "formezi clasele", "verifici dacă nu se suprapun"],
      },
    ],
    keyQuestion: "După ce criteriu împart și acopăr toate cazurile?",
  },
}
