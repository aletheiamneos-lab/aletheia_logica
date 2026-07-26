import commonExample from "./games/commonExample.json"
import { getWhyItemsForGame } from "./whyModule"

function flattenLevels(levels) {
  return [...levels.easy, ...levels.medium, ...levels.hard]
}

function buildGame(config) {
  return {
    ...config,
    whyItems: getWhyItemsForGame(config.id),
    training: flattenLevels(config.levels),
  }
}

export const games = [
  buildGame({
    id: "patratul-logic",
    title: "1. Patratul logic",
    subtitle: "Relatii intre A, E, I si O pe acelasi univers semantic",
    description:
      "Lucrezi opozitiile dintre propozitiile categorice si inveti sa deduci corect adevarul, falsul sau nedeterminarea.",
    introduction:
      "Jocul te antreneaza sa pleci de la o singura forma si sa completezi coerent tot Patratul logic. Nu memorezi sageti, ci vezi cum lucreaza contradictia, contrarietatea si subalternarea.",
    explanation:
      "Patratul logic functioneaza pentru ca fiecare relatie transmite sau blocheaza valori diferit: contradictoria inverseaza sigur, contraria si subcontraria nu fixeaza mereu tot, iar subalternarea coboara de la universal la particular.",
    gameMode: {
      title: "Mod de joc",
      description:
        "Primesti o forma si valoarea ei, apoi completezi rapid valorile pentru toate cele patru propozitii din Patratul logic.",
    },
    trainingMode: {
      title: "Mod de antrenament complet",
      description:
        "Treci prin exercitii integrate pe niveluri si justifici pas cu pas de ce o relatie din Patrat produce exact acel verdict.",
    },
    examples: [
      {
        question: "Daca A este adevarata, ce se intampla cu O?",
        answer: "O devine falsa.",
        explanation: "A si O sunt contradictorii, deci nu pot avea aceeasi valoare de adevar.",
      },
      {
        question: "Daca E este falsa, ce poti spune sigur despre I?",
        answer: "I devine adevarata.",
        explanation: "E si I sunt contradictorii, iar falsul uneia face adevarata cealalta.",
      },
    ],
    playground: {
      cases: [
        {
          id: 1,
          statement: "Toti elevii sunt silitori.",
          form: "A",
          truth: true,
          explanation:
            "Daca A este adevarata, atunci I devine adevarata, iar E si O devin false.",
        },
        {
          id: 2,
          statement: "Niciun elev nu este silitor.",
          form: "E",
          truth: false,
          explanation:
            "Daca E este falsa, atunci I devine adevarata, iar A si O raman nedeterminate.",
        },
        {
          id: 3,
          statement: "Unii elevi sunt silitori.",
          form: "I",
          truth: true,
          explanation:
            "Daca I este adevarata, atunci E devine falsa, dar A si O nu pot fi fixate sigur.",
        },
        {
          id: 4,
          statement: "Unii elevi nu sunt silitori.",
          form: "O",
          truth: false,
          explanation:
            "Daca O este falsa, atunci A devine adevarata, E devine falsa, iar I devine adevarata.",
        },
      ],
      squareForms: [
        { key: "A", statement: "Toti elevii sunt silitori." },
        { key: "E", statement: "Niciun elev nu este silitor." },
        { key: "I", statement: "Unii elevi sunt silitori." },
        { key: "O", statement: "Unii elevi nu sunt silitori." },
      ],
    },
    levels: {
      easy: [
        {
          id: "patrat_easy_1",
          level: "usor",
          title: "Contradictoria lui A",
          situation: "Stii ca propozitia A este adevarata: \"Toti elevii sunt silitori.\"",
          steps: [
            {
              id: "patrat_easy_1_step_1",
              type: "multiple_choice",
              question: "Care este contradictoria lui A?",
              options: ["E", "I", "O", "niciuna"],
              correct_answer: "O",
              explanation: "Pentru forma A, contradictoria este O.",
            },
            {
              id: "patrat_easy_1_step_2",
              type: "multiple_choice",
              question: "Ce valoare are O daca A este adevarata?",
              options: ["adevarata", "falsa", "nedeterminata", "imposibila"],
              correct_answer: "falsa",
              explanation: "Contradictoriile nu pot fi adevarate impreuna.",
            },
          ],
          final_explanation:
            "Pe nivelul usor fixezi mecanismul de baza: contradictoria schimba sigur valoarea propozitiei.",
        },
      ],
      medium: [
        {
          id: "patrat_medium_1",
          level: "mediu",
          title: "Deduci tot Patratul din O falsa",
          situation: "Pornesti de la propozitia O falsa: \"Unii elevi nu sunt silitori.\"",
          steps: [
            {
              id: "patrat_medium_1_step_1",
              type: "multiple_choice",
              question: "Ce forma devine sigur adevarata?",
              options: ["A", "E", "I", "niciuna"],
              correct_answer: "A",
              explanation: "A si O sunt contradictorii. Daca O este falsa, A devine adevarata.",
            },
            {
              id: "patrat_medium_1_step_2",
              type: "multiple_choice",
              question: "Ce se intampla cu I?",
              options: ["adevarata", "falsa", "nedeterminata", "imposibila"],
              correct_answer: "adevarata",
              explanation: "Adevarul lui A coboara prin subalternare la I.",
            },
            {
              id: "patrat_medium_1_step_3",
              type: "multiple_choice",
              question: "Ce valoare are E?",
              options: ["adevarata", "falsa", "nedeterminata", "imposibila"],
              correct_answer: "falsa",
              explanation: "A si E sunt contrare, deci nu pot fi ambele adevarate.",
            },
          ],
          final_explanation:
            "Exercitiul mediu te obliga sa combini contradictia, subalternarea si contrarietatea in aceeasi secventa.",
        },
      ],
      hard: [
        {
          id: "patrat_hard_1",
          level: "greu",
          title: "Separi ce este sigur de ce ramane nedeterminat",
          situation: "Stii doar ca I este adevarata: \"Unii elevi sunt silitori.\"",
          steps: [
            {
              id: "patrat_hard_1_step_1",
              type: "multiple_choice",
              question: "Ce forma devine sigur falsa?",
              options: ["A", "E", "I", "O"],
              correct_answer: "E",
              explanation: "E si I sunt contradictorii.",
            },
            {
              id: "patrat_hard_1_step_2",
              type: "multiple_choice",
              question: "Ce valoare are A?",
              options: ["adevarata", "falsa", "nedeterminata", "imposibila"],
              correct_answer: "nedeterminata",
              explanation: "I adevarata nu fixeaza automat A.",
            },
            {
              id: "patrat_hard_1_step_3",
              type: "multiple_choice",
              question: "Care este capcana principala?",
              options: [
                "Sa transformi subcontraria in contradictie",
                "Sa inversezi termenii S si P",
                "Sa confunzi A cu SeP",
                "Sa negi cuantorul",
              ],
              correct_answer: "Sa transformi subcontraria in contradictie",
              explanation: "Din I adevarata nu rezulta automat O falsa.",
            },
          ],
          final_explanation:
            "Nivelul greu cere control logic: separi relatiile care decid sigur valoarea de cele care lasa lucrurile nedeterminate.",
        },
      ],
    },
  }),
  buildGame({
    id: "forme-categorice",
    title: "2. Forme categorice",
    subtitle: "A, E, I, O si notarea SaP / SeP / SiP / SoP",
    description:
      "Pornesti din limbaj natural si reconstruiesti forma logica exacta: litera, simbol, cantitate si calitate.",
    introduction:
      "Jocul iti antreneaza reflexul de a recunoaste imediat tipul propozitiei categorice. Accentul cade pe cuantor, pe semnul negatiei si pe raportul corect dintre S si P.",
    explanation:
      "Formele categorice functioneaza doar daca citesti complet propozitia: mai intai cuantorul, apoi calitatea, apoi raportul dintre subiect si predicat. Orice scurtatura aici produce confuzii intre A, E, I si O.",
    gameMode: {
      title: "Mod de joc",
      description:
        "Traduci fiecare enunt in litera, forma simbolica, cantitate si calitate, apoi verifici unde ai ratat lectura logica.",
    },
    trainingMode: {
      title: "Mod de antrenament complet",
      description:
        "Rezolvi exercitii structurate pe niveluri, unde combinam identificarea formei cu reguli de opozitie si transformari imediate.",
    },
    examples: [
      {
        question: "\"Niciun elev nu este silitor\" ce forma are?",
        answer: "E, adica SeP.",
        explanation: "Cuantorul este universal, iar enuntul este negativ.",
      },
      {
        question: "\"Unii elevi nu sunt silitori\" ce trebuie sa observi prima data?",
        answer: "Ca negatia este particulara, nu universala.",
        explanation: "Tocmai de aceea forma este O, nu E.",
      },
    ],
    playground: {
      items: [
        {
          id: 1,
          natural: "Toti elevii sunt silitori.",
          form: "A",
          symbolic: "SaP",
          quantity: "universala",
          quality: "afirmativa",
          explanation: "Forma A este universala afirmativa si se scrie traditional SaP.",
        },
        {
          id: 2,
          natural: "Niciun elev nu este silitor.",
          form: "E",
          symbolic: "SeP",
          quantity: "universala",
          quality: "negativa",
          explanation: "Forma E este universala negativa si se scrie traditional SeP.",
        },
        {
          id: 3,
          natural: "Unii elevi sunt silitori.",
          form: "I",
          symbolic: "SiP",
          quantity: "particulara",
          quality: "afirmativa",
          explanation: "Forma I este particulara afirmativa si se scrie traditional SiP.",
        },
        {
          id: 4,
          natural: "Unii elevi nu sunt silitori.",
          form: "O",
          symbolic: "SoP",
          quantity: "particulara",
          quality: "negativa",
          explanation: "Forma O este particulara negativa si se scrie traditional SoP.",
        },
      ],
    },
    levels: {
      easy: [
        {
          id: "categorice_easy_1",
          level: "usor",
          title: "Recunosti forma A",
          situation: "Analizezi propozitia: \"Toti elevii sunt silitori.\"",
          steps: [
            {
              id: "categorice_easy_1_step_1",
              type: "multiple_choice",
              question: "Ce litera logica are propozitia?",
              options: ["A", "E", "I", "O"],
              correct_answer: "A",
              explanation: "Cuantorul universal si calitatea afirmativa indica forma A.",
            },
            {
              id: "categorice_easy_1_step_2",
              type: "multiple_choice",
              question: "Care este simbolizarea corecta?",
              options: ["SaP", "SeP", "SiP", "SoP"],
              correct_answer: "SaP",
              explanation: "Pentru A, forma traditionala este SaP.",
            },
          ],
          final_explanation:
            "Nivelul usor fixeaza baza: recunosti corect quantorul si il traduci in notatia standard.",
        },
      ],
      medium: [
        {
          id: "categorice_medium_1",
          level: "mediu",
          title: "Separi E de O",
          situation: "Analizezi propozitia: \"Unii elevi nu sunt silitori.\"",
          steps: [
            {
              id: "categorice_medium_1_step_1",
              type: "multiple_choice",
              question: "Ce forma categorica ai?",
              options: ["A", "E", "I", "O"],
              correct_answer: "O",
              explanation: "Cuantorul ramane particular, iar calitatea este negativa.",
            },
            {
              id: "categorice_medium_1_step_2",
              type: "multiple_choice",
              question: "Care este calitatea propozitiei?",
              options: ["afirmativa", "negativa", "universala", "particulara"],
              correct_answer: "negativa",
              explanation: "Negatia cade pe raportul dintre S si P.",
            },
            {
              id: "categorice_medium_1_step_3",
              type: "multiple_choice",
              question: "Care este capcana clasica?",
              options: [
                "Sa o tratezi ca E doar pentru ca este negativa",
                "Sa inversezi subiectul cu predicatul",
                "Sa o reduci la p si q",
                "Sa o citesti ca forma I",
              ],
              correct_answer: "Sa o tratezi ca E doar pentru ca este negativa",
              explanation: "Negativitatea nu este suficienta; trebuie citit si cuantorul.",
            },
          ],
          final_explanation:
            "Exercitiul mediu te obliga sa citesti propozitia integral si sa nu confunzi negativitatea cu universalitatea.",
        },
      ],
      hard: [
        {
          id: "categorice_hard_1",
          level: "greu",
          title: "Legi forma de o transformare corecta",
          situation: "Pornesti de la propozitia E: \"Niciun elev nu este silitor.\"",
          steps: [
            {
              id: "categorice_hard_1_step_1",
              type: "multiple_choice",
              question: "Ce forma simbolica are premisa?",
              options: ["SaP", "SeP", "SiP", "SoP"],
              correct_answer: "SeP",
              explanation: "E se noteaza traditional SeP.",
            },
            {
              id: "categorice_hard_1_step_2",
              type: "multiple_choice",
              question: "Care este obversa corecta?",
              options: [
                "Toti elevii sunt non-silitori.",
                "Unii elevi nu sunt silitori.",
                "Toti silitorii sunt elevi.",
                "Unii non-silitori sunt elevi.",
              ],
              correct_answer: "Toti elevii sunt non-silitori.",
              explanation: "Obversa schimba calitatea si neaga predicatul.",
            },
            {
              id: "categorice_hard_1_step_3",
              type: "boolean",
              question: "Este valida conversiunea simpla din E?",
              options: [true, false],
              correct_answer: true,
              explanation: "Forma E admite conversiune simpla valida.",
            },
          ],
          final_explanation:
            "Nivelul greu combina recunoasterea formei cu transformarea imediata si controlul validitatii ei.",
        },
      ],
    },
  }),
  buildGame({
    id: "tabel-adevar",
    title: "3. Tabelul de adevar",
    subtitle: "Formula, randuri si scheme de inferenta pe p si q",
    description:
      "Acelasi continut semantic devine formula propozitionala, tabel de adevar si argument logic verificat prin schema.",
    introduction:
      "Jocul te antreneaza sa traduci rapid in p si q, sa completezi corect randurile tabelului si sa vezi cand o schema este valida sau cade intr-un sofism.",
    explanation:
      "Logica propozitionala merge bine doar daca pastrezi ordinea: notezi propozitiile simple, alegi operatorul corect si abia apoi verifici randurile sau schema. Cele mai multe erori apar prin inversarea implicatiei sau prin citirea gresita a lui «numai daca».",
    gameMode: {
      title: "Mod de joc",
      description:
        "Completezi tabelul de adevar si verifici instant unde ai gresit pe randuri, fara sa iesi din exemplul semantic fix.",
    },
    trainingMode: {
      title: "Mod de antrenament complet",
      description:
        "Lucrezi pe niveluri: traducere in p si q, verificarea randurilor si recunoasterea schemelor valide sau nevalide.",
    },
    examples: [
      {
        question: "\"Daca un elev invata, atunci promoveaza\" cand este fals?",
        answer: "Doar cand p este adevarat si q este fals.",
        explanation: "Implicatia promite ca adevarul lui p nu apare fara q.",
      },
      {
        question: "De ce este gresit «promoveaza, deci a invatat»?",
        answer: "Pentru ca afirma consecventul.",
        explanation: "Din q nu rezulta automat p.",
      },
    ],
    playground: {
      exercises: [
        {
          id: 1,
          statement: "Daca un copil este elev, atunci este silitor.",
          formula: "p -> q",
          explanation: "Implicatia este falsa doar atunci cand p este adevarat si q este fals.",
          truthRows: [
            { p: "T", q: "T", result: "T" },
            { p: "T", q: "F", result: "F" },
            { p: "F", q: "T", result: "T" },
            { p: "F", q: "F", result: "T" },
          ],
        },
        {
          id: 2,
          statement: "Copilul este elev si este silitor.",
          formula: "p & q",
          explanation:
            "Conjunctia este adevarata doar atunci cand ambele propozitii sunt adevarate.",
          truthRows: [
            { p: "T", q: "T", result: "T" },
            { p: "T", q: "F", result: "F" },
            { p: "F", q: "T", result: "F" },
            { p: "F", q: "F", result: "F" },
          ],
        },
      ],
    },
    levels: {
      easy: [
        {
          id: "propozitional_easy_1",
          level: "usor",
          title: "Traduci rapid in p si q",
          situation: "Ai enuntul: \"Daca un elev invata, atunci promoveaza.\"",
          steps: [
            {
              id: "propozitional_easy_1_step_1",
              type: "multiple_choice",
              question: "Cum notezi corect propozitiile simple?",
              options: [
                "p = elevul invata; q = elevul promoveaza",
                "p = elevul promoveaza; q = elevul invata",
                "p = elevul este prezent; q = elevul invata",
                "p = elevul este silitor; q = elevul promoveaza",
              ],
              correct_answer: "p = elevul invata; q = elevul promoveaza",
              explanation: "Antecedentul devine p, iar consecventul devine q.",
            },
            {
              id: "propozitional_easy_1_step_2",
              type: "multiple_choice",
              question: "Care este forma logica a enuntului?",
              options: ["p & q", "p -> q", "p <-> q", "nu p sau nu q"],
              correct_answer: "p -> q",
              explanation: "Formularea \"daca..., atunci...\" indica implicatie.",
            },
          ],
          final_explanation:
            "Nivelul usor fixeaza pasul de baza: traduci enuntul in variabile si alegi operatorul logic potrivit.",
        },
      ],
      medium: [
        {
          id: "propozitional_medium_1",
          level: "mediu",
          title: "Citesti randul fals al implicatiei",
          situation: "Verifici formula p -> q prin tabel de adevar.",
          steps: [
            {
              id: "propozitional_medium_1_step_1",
              type: "multiple_choice",
              question: "In ce rand este falsa implicatia?",
              options: ["T/T", "T/F", "F/T", "F/F"],
              correct_answer: "T/F",
              explanation: "Implicatia se rupe doar cand promisiunea este incalcata: p adevarat, q fals.",
            },
            {
              id: "propozitional_medium_1_step_2",
              type: "multiple_choice",
              question: "Care este capcana frecventa?",
              options: [
                "Sa marchezi si F/F ca fals",
                "Sa confunzi A cu O",
                "Sa inversezi S cu P",
                "Sa citesti I ca E",
              ],
              correct_answer: "Sa marchezi si F/F ca fals",
              explanation: "Cand p este fals, implicatia nu este incalcata.",
            },
            {
              id: "propozitional_medium_1_step_3",
              type: "boolean",
              question: "Este randul F/T compatibil cu implicatia?",
              options: [true, false],
              correct_answer: true,
              explanation: "Da. Daca p este fals, formula ramane adevarata in logica clasica.",
            },
          ],
          final_explanation:
            "Exercitiul mediu antreneaza lectura corecta a randului critic din tabelul de adevar.",
        },
      ],
      hard: [
        {
          id: "propozitional_hard_1",
          level: "greu",
          title: "Recunosti o schema nevalida",
          situation:
            "Argument: \"Daca elevul este prezent, atunci poate sustine testul. Elevul poate sustine testul. Deci elevul este prezent.\"",
          steps: [
            {
              id: "propozitional_hard_1_step_1",
              type: "multiple_choice",
              question: "Ce schema apare in argument?",
              options: [
                "(p -> q), p => q",
                "(p -> q), q => p",
                "(p -> q), nu q => nu p",
                "(p sau q), nu p => q",
              ],
              correct_answer: "(p -> q), q => p",
              explanation: "Premisa a doua afirma consecventul q, iar concluzia intoarce nepermis spre p.",
            },
            {
              id: "propozitional_hard_1_step_2",
              type: "boolean",
              question: "Este argumentul valid?",
              options: [true, false],
              correct_answer: false,
              explanation: "Schema este afirmarea consecventului, deci nu este valida.",
            },
            {
              id: "propozitional_hard_1_step_3",
              type: "multiple_choice",
              question: "De ce cade argumentul?",
              options: [
                "Pentru ca q poate fi adevarata si din alte motive decat p",
                "Pentru ca implicatia este mereu falsa",
                "Pentru ca p si q nu pot sta impreuna",
                "Pentru ca a doua premisa este negativa",
              ],
              correct_answer: "Pentru ca q poate fi adevarata si din alte motive decat p",
              explanation: "Consecventul nu garanteaza singur cauza initiala.",
            },
          ],
          final_explanation:
            "Nivelul greu combina schema, verdictul si justificarea concreta a nevaliditatii.",
        },
      ],
    },
  }),
]

export const learningGames = games

export { commonExample }
