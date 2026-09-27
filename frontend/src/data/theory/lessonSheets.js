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

  definitia: {
    rows: [
      {
        type: "definition",
        tone: "green",
        text: "**Definiția** explică ce este un obiect sau o noțiune prin trăsăturile lui **esențiale**.",
      },
      {
        columns: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
        blocks: [
          {
            type: "formula",
            number: 1,
            title: "Structura definiției",
            tone: "green",
            parts: [
              { label: "definit", tone: "green" },
              { label: "copulă", tone: "blue" },
              { label: "definitor", tone: "red" },
            ],
            example: [
              { word: "Omul", role: "definit", tone: "green" },
              { word: "este", role: "copulă", tone: "blue" },
              { word: "animal rațional", role: "definitor", tone: "red" },
            ],
          },
          {
            type: "formula",
            number: 2,
            title: "Cum construiești o definiție bună?",
            tone: "blue",
            parts: [
              { label: "gen proxim", tone: "green" },
              { label: "diferență specifică", tone: "red" },
            ],
            exampleText: "**Pătratul** este **paralelogramul** → gen proxim, **cu toate laturile egale și toate unghiurile drepte** → diferență specifică.",
          },
          {
            type: "list",
            number: 3,
            title: "Regulile definiției",
            tone: "amber",
            items: [
              "să fie **adecvată**",
              "să fie **clară și precisă**",
              "să **nu fie circulară**",
              "să exprime **însușiri esențiale**",
              "să evite formulările **negative**, dacă se poate",
            ],
          },
        ],
      },
      {
        type: "compare",
        good: {
          title: "4. Definiție corectă",
          text: "**Triunghiul echilateral** este triunghiul cu trei laturi egale.",
          verdict: "Gen proxim (triunghi) + diferență specifică (trei laturi egale).",
        },
        bad: {
          title: "5. Definiție greșită",
          text: "**Omul** este om.",
          verdict: "Greșeală: circularitate — definitul se repetă în definitor.",
        },
      },
    ],
    keyLabel: "Întrebările-cheie",
    keyQuestion: "Ce este? · Din ce clasă face parte? · Prin ce se deosebește?",
  },

  propozitiileCategorice: {
    rows: [
      {
        columns: "minmax(0,1fr) minmax(0,1.2fr)",
        blocks: [
          {
            type: "definition",
            title: "Definiție",
            tone: "green",
            text: "Propoziția categorică **afirmă sau neagă** ceva despre un **subiect (S)** și un **predicat (P)**.",
          },
          {
            type: "formula",
            title: "Structură",
            tone: "blue",
            parts: [
              { label: "cuantor", tone: "blue" },
              { label: "subiect (S)", tone: "green" },
              { label: "copulă", tone: "amber" },
              { label: "predicat (P)", tone: "purple" },
            ],
            example: [
              { word: "Toți", role: "cuantor", tone: "blue" },
              { word: "elevii", role: "subiect", tone: "green" },
              { word: "sunt", role: "copulă", tone: "amber" },
              { word: "persoane", role: "predicat", tone: "purple" },
            ],
          },
        ],
      },
      {
        columns: "minmax(0,1.7fr) minmax(0,1fr)",
        blocks: [
          {
            type: "table",
            title: "Tipuri de propoziții categorice",
            tone: "blue",
            columns: ["Tip", "Forma standard", "Exemplu"],
            rows: [
              ["**A** · universal afirmativă", "Toți S sunt P", "Toți elevii sunt persoane."],
              ["**E** · universal negativă", "Niciun S nu este P", "Niciun triunghi nu este cerc."],
              ["**I** · particular afirmativă", "Unii S sunt P", "Unii elevi sunt premianți."],
              ["**O** · particular negativă", "Unii S nu sunt P", "Unii elevi nu sunt absenți."],
            ],
          },
          {
            type: "glossary",
            title: "Cantitate și calitate",
            tone: "amber",
            items: [
              { key: "Universală", tone: "green", text: "se referă la **toți** S" },
              { key: "Particulară", tone: "blue", text: "se referă la **unii** S" },
              { key: "Afirmativă", tone: "amber", text: "**afirmă** ceva despre S" },
              { key: "Negativă", tone: "red", text: "**neagă** ceva despre S" },
            ],
          },
        ],
      },
      {
        columns: "minmax(0,1fr) minmax(0,1fr)",
        blocks: [
          {
            type: "glossary",
            title: "Distribuirea termenilor",
            tone: "green",
            plain: true,
            items: [
              { key: "A", big: true, tone: "blue", text: "S distribuit, P nedistribuit" },
              { key: "E", big: true, tone: "green", text: "S distribuit, P distribuit" },
              { key: "I", big: true, tone: "amber", text: "nici S, nici P distribuit" },
              { key: "O", big: true, tone: "red", text: "S nedistribuit, P distribuit" },
            ],
          },
          {
            type: "rule",
            title: "Reține",
            tone: "blue",
            text: "**A** și **E** sunt **universale**; **I** și **O** sunt **particulare**.",
          },
        ],
      },
    ],
  },

  patratulLogic: {
    rows: [
      {
        columns: "minmax(0,1.5fr) minmax(0,1fr)",
        blocks: [
          { type: "square", title: "Pătratul logic", tone: "blue" },
          {
            type: "glossary",
            title: "Cum se citesc?",
            tone: "slate",
            plain: true,
            items: [
              { key: "Contradicția", tone: "slate", text: "una este **adevărată**, cealaltă **falsă** (A–O, E–I)." },
              { key: "Contrarietatea", tone: "red", text: "nu pot fi **ambele adevărate** (A–E)." },
              { key: "Subcontrarietatea", tone: "green", text: "nu pot fi **ambele false** (I–O)." },
              { key: "Subalternarea", tone: "amber", text: "**adevărul coboară**, **falsul urcă** (A→I, E→O)." },
            ],
          },
        ],
      },
      {
        type: "definition",
        tone: "blue",
        text: "Pătratul logic arată raporturile dintre propozițiile **A, E, I și O** care au **același subiect și același predicat**.",
      },
      {
        type: "cards",
        title: "Exemplu (același S și P)",
        items: [
          { badge: "A", tone: "blue", title: "Toți elevii sunt punctuali." },
          { badge: "E", tone: "red", title: "Niciun elev nu este punctual." },
          { badge: "I", tone: "green", title: "Unii elevi sunt punctuali." },
          { badge: "O", tone: "amber", title: "Unii elevi nu sunt punctuali." },
        ],
      },
    ],
    keyQuestion: "Ce relație există între propoziții?",
  },

  silogismul: {
    rows: [
      {
        type: "definition",
        tone: "blue",
        text: "**Silogismul** este un argument **deductiv** format din **două premise** și **o concluzie**, cu trei termeni: **S, P și M**.",
      },
      {
        columns: "minmax(0,0.8fr) minmax(0,1fr) minmax(0,1.1fr)",
        blocks: [
          {
            type: "glossary",
            title: "Termenii silogismului",
            tone: "slate",
            plain: true,
            items: [
              { key: "S", big: true, tone: "green", text: "termen **minor** (subiectul concluziei)" },
              { key: "P", big: true, tone: "blue", text: "termen **major** (predicatul concluziei)" },
              { key: "M", big: true, tone: "amber", text: "termen **mediu** (apare doar în premise)" },
            ],
          },
          {
            type: "table",
            title: "Structura silogismului",
            columns: ["Parte", "Schemă"],
            rows: [
              ["Premisa majoră", "`M – P`"],
              ["Premisa minoră", "`S – M`"],
              ["**Concluzia**", "`S – P`"],
            ],
          },
          {
            type: "list",
            title: "Reguli esențiale",
            tone: "red",
            items: [
              "termenul **mediu** trebuie distribuit **cel puțin o dată**",
              "din două premise **negative** nu rezultă concluzie",
              "dacă o premisă e **negativă**, concluzia e **negativă**",
              "din două premise **particulare** nu rezultă concluzie",
            ],
          },
        ],
      },
      {
        type: "steps",
        title: "Cum îl rezolvi?",
        tone: "slate",
        items: ["identifici concluzia", "găsești termenii S, P, M", "stabilești premisele", "verifici regulile"],
      },
      {
        type: "argument",
        title: "Exemplu rezolvat",
        premises: ["Toți juriștii cunosc legea.", "Unii studenți sunt juriști."],
        conclusion: "unii studenți cunosc legea.",
        legend: [
          { key: "M", tone: "amber", text: "juriști" },
          { key: "S", tone: "green", text: "studenți" },
          { key: "P", tone: "blue", text: "cunoscători ai legii" },
        ],
      },
    ],
    keyQuestion: "Este legătura dintre premise și concluzie corectă?",
  },

  operatoriLogiciSiTabeleDeAdevar: {
    rows: [
      {
        columns: "minmax(0,1fr) minmax(0,1.6fr)",
        blocks: [
          {
            type: "definition",
            tone: "blue",
            text: "**Operatorii logici** leagă propoziții simple și ne ajută să aflăm **valoarea de adevăr** a propozițiilor compuse.",
          },
          {
            type: "table",
            title: "Cheia operatorilor",
            columns: ["negație", "conjuncție", "disjuncție", "implicație", "echivalență"],
            rows: [["`¬`", "`∧`", "`∨`", "`→`", "`↔`"]],
          },
        ],
      },
      {
        type: "truth",
        title: "Tabelele de adevăr",
        note: "A = adevărat, F = fals",
        tables: [
          { name: "1. Negație", symbol: "¬p", columns: ["p", "¬p"], rows: [["A", "F"], ["F", "A"]] },
          { name: "2. Conjuncție", symbol: "p ∧ q", columns: ["p", "q", "p∧q"], rows: [["A", "A", "A"], ["A", "F", "F"], ["F", "A", "F"], ["F", "F", "F"]] },
          { name: "3. Disjuncție", symbol: "p ∨ q", columns: ["p", "q", "p∨q"], rows: [["A", "A", "A"], ["A", "F", "A"], ["F", "A", "A"], ["F", "F", "F"]] },
          { name: "4. Implicație", symbol: "p → q", columns: ["p", "q", "p→q"], rows: [["A", "A", "A"], ["A", "F", "F"], ["F", "A", "A"], ["F", "F", "A"]] },
          { name: "5. Echivalență", symbol: "p ↔ q", columns: ["p", "q", "p↔q"], rows: [["A", "A", "A"], ["A", "F", "F"], ["F", "A", "F"], ["F", "F", "A"]] },
        ],
      },
      {
        columns: "minmax(0,1.5fr) minmax(0,1fr)",
        blocks: [
          {
            type: "cards",
            title: "Exemple din viața de zi cu zi",
            tone: "blue",
            items: [
              {
                title: "Plouă și e frig = `p ∧ q`",
                lines: ["p: Plouă", "q: E frig"],
                note: "Este adevărată doar când și plouă, și este frig.",
              },
              {
                title: "Plouă sau ninge = `p ∨ q`",
                lines: ["p: Plouă", "q: Ninge"],
                note: "Este falsă doar când nici nu plouă, nici nu ninge.",
              },
            ],
          },
          {
            type: "list",
            title: "Note esențiale",
            tone: "blue",
            items: [
              "`p ∧ q` e adevărată **doar când ambele** sunt adevărate",
              "`p ∨ q` e falsă **doar când ambele** sunt false",
              "`p → q` e falsă **doar când p e adevărată și q falsă**",
              "`p ↔ q` e adevărată când p și q au **aceeași valoare**",
            ],
          },
        ],
      },
    ],
    keyQuestion: "În ce condiții este propoziția adevărată sau falsă?",
  },

  dinLimbajNaturalInFormal: {
    title: "Din limbaj natural în limbaj formal",
    rows: [
      {
        type: "definition",
        tone: "blue",
        text: "Traducerea în limbaj formal înseamnă transformarea unei propoziții obișnuite **într-o schemă logică**.",
      },
      {
        type: "steps",
        title: "Pașii",
        tone: "blue",
        items: ["identifică subiectul și predicatul", "caută cuantorul: toți / niciun / unii", "observă negația sau conectorul logic", "alege forma logică potrivită"],
      },
      {
        columns: "minmax(0,1fr) minmax(0,1fr)",
        blocks: [
          {
            type: "table",
            title: "Pentru propoziții categorice",
            columns: ["În limbaj natural", "În limbaj formal"],
            rows: [
              ["Toți elevii sunt silitori", "`SaP`"],
              ["Niciun elev nu este absent", "`SeP`"],
              ["Unii elevi sunt sportivi", "`SiP`"],
              ["Unii elevi nu sunt punctuali", "`SoP`"],
            ],
            note: "S = subiect, P = predicat",
          },
          {
            type: "table",
            title: "Pentru propoziții compuse",
            columns: ["În limbaj natural", "În limbaj formal"],
            rows: [
              ["Dacă plouă, atunci strada este udă", "`p → q`"],
              ["Ana învață și citește", "`p ∧ q`"],
              ["Mergem la film sau rămânem acasă", "`p ∨ q`"],
              ["Nu este adevărat că Paul doarme", "`¬p`"],
            ],
            note: "p și q reprezintă propoziții simple.",
          },
        ],
      },
      {
        type: "chips",
        title: "Atenție la cuvintele-indiciu",
        tone: "red",
        items: ["toți", "niciun", "unii", "dacă…, atunci", "și", "sau", "nu"],
      },
    ],
    keyQuestion: "Ce element logic ascunde propoziția?",
  },

  dinLimbajFormalInNatural: {
    title: "Din limbaj formal în limbaj natural",
    rows: [
      {
        type: "definition",
        tone: "amber",
        text: "Traducerea în limbaj natural înseamnă **citirea simbolurilor logice** ca propoziții obișnuite și clare.",
      },
      {
        columns: "minmax(0,1fr) minmax(0,1fr)",
        blocks: [
          {
            type: "table",
            number: 1,
            title: "Decodificarea formulelor categorice",
            tone: "blue",
            columns: ["În limbaj formal", "În limbaj natural"],
            rows: [
              ["`SaP`", "Toți S sunt P"],
              ["`SeP`", "Niciun S nu este P"],
              ["`SiP`", "Unii S sunt P"],
              ["`SoP`", "Unii S nu sunt P"],
            ],
            note: "S = subiect, P = predicat",
          },
          {
            type: "table",
            number: 2,
            title: "Decodificarea simbolurilor propoziționale",
            tone: "green",
            columns: ["În limbaj formal", "În limbaj natural"],
            rows: [
              ["`¬p`", "nu p / nu este adevărat că p"],
              ["`p ∧ q`", "p și q"],
              ["`p ∨ q`", "p sau q"],
              ["`p → q`", "dacă p, atunci q"],
              ["`p ↔ q`", "p dacă și numai dacă q"],
            ],
          },
        ],
      },
      {
        type: "steps",
        number: 3,
        title: "Pași pentru traducere",
        tone: "blue",
        items: ["citești simbolul", "înlocuiești literele cu enunțuri", "verifici dacă propoziția are sens"],
      },
      {
        columns: "minmax(0,1.8fr) minmax(0,0.8fr)",
        blocks: [
          {
            type: "table",
            number: 4,
            title: "Exemple rezolvate",
            tone: "purple",
            columns: ["Formula", "Traducerea"],
            rows: [
              ["`SaP`, unde S = elevi, P = punctuali", "Toți elevii sunt punctuali."],
              ["`p → q`, unde p = plouă, q = strada este udă", "Dacă plouă, atunci strada este udă."],
              ["`¬(p ∧ q)`, unde p = Ana învață, q = Ana lucrează", "Nu este adevărat că Ana învață și lucrează."],
            ],
          },
          {
            type: "rule",
            title: "Sfat",
            tone: "amber",
            text: "Gândește-te la **sensul cuvintelor**, nu doar la simboluri!",
          },
        ],
      },
    ],
    keyQuestion: "Cum citesc corect simbolurile?",
  },

  argumentareaLogica: {
    rows: [
      {
        columns: "minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr)",
        blocks: [
          {
            type: "definition",
            number: 1,
            title: "Ce înseamnă?",
            tone: "green",
            text: "A argumenta înseamnă a **susține o idee** prin motive și a ajunge la o **concluzie**.",
          },
          {
            type: "formula",
            number: 2,
            title: "Structura unui argument",
            tone: "blue",
            result: true,
            parts: [
              { label: "premisa 1", tone: "green" },
              { label: "premisa 2", tone: "green" },
              { label: "teză / concluzie", tone: "blue" },
            ],
            exampleText: "Premisele sunt **motivele**; concluzia este **ideea susținută** de ele.",
          },
          {
            type: "list",
            number: 3,
            title: "Cum recunoști un argument?",
            tone: "amber",
            items: ["are **afirmații care susțin** o idee", "premisele trebuie să fie **relevante**", "concluzia trebuie să **rezulte logic**"],
          },
        ],
      },
      {
        columns: "minmax(0,1fr) minmax(0,1fr)",
        blocks: [
          {
            type: "argument",
            number: "4A",
            title: "Argument valid",
            tone: "green",
            premises: ["Toți oamenii sunt muritori.", "Socrate este om."],
            conclusion: "Socrate este muritor.",
            verdict: "Corect logic: concluzia rezultă din premise.",
          },
          {
            type: "argument",
            number: "4B",
            title: "Argument invalid",
            tone: "red",
            valid: false,
            premises: ["Toți medicii au studii superioare.", "Ana are studii superioare."],
            conclusion: "Ana este medic.",
            verdict: "Concluzia nu rezultă necesar din premise.",
          },
        ],
      },
      {
        type: "chips",
        number: 5,
        title: "Indicatori de concluzie",
        tone: "blue",
        items: ["deci", "prin urmare", "așadar"],
      },
    ],
    keyQuestion: "Concluzia chiar se sprijină pe premise?",
  },
}
