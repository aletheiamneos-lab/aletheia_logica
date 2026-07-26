const pqRelationBlock = {
  type: "pq_relation",
  operators: [
    {
      id: "conjunction",
      symbol: "p ∧ q",
      label: "Conjuncție",
      pRole: "prima propoziție care trebuie să fie adevărată",
      qRole: "a doua propoziție care trebuie să fie adevărată",
      relationText:
        "În conjuncție, p și q lucrează împreună. Formula este adevărată doar dacă ambele propoziții sunt adevărate simultan.",
      fastRule: "Un singur fals strică toată conjuncția.",
      rowExplanations: {
        tt: "Aici p și q sunt ambele adevărate, deci și conjuncția este adevărată.",
        tf: "p este adevărată, dar q este falsă. Pentru conjuncție, asta este suficient ca formula să devină falsă.",
        ft: "q este adevărată, dar p este falsă. Din nou, un singur fals face conjuncția falsă.",
        ff: "Ambele sunt false, deci conjuncția rămâne falsă.",
      },
      rowExamples: {
        tt: {
          prompt: "Înveți și repeți materia.",
          formula: "p = 1, q = 1 => p ∧ q = 1",
          note: "Înveți și repeți, deci ambele părți sunt adevărate și conjuncția rămâne adevărată.",
        },
        tf: {
          prompt: "Înveți, dar nu repeți materia.",
          formula: "p = 1, q = 0 => p ∧ q = 0",
          note: "Lipsește una dintre cele două condiții, iar conjuncția cade imediat.",
        },
        ft: {
          prompt: "Nu înveți, dar repeți materia veche.",
          formula: "p = 0, q = 1 => p ∧ q = 0",
          note: "Un singur fals este suficient ca întreaga conjuncție să devină falsă.",
        },
        ff: {
          prompt: "Nici nu înveți, nici nu repeți materia.",
          formula: "p = 0, q = 0 => p ∧ q = 0",
          note: "Când ambele componente cad, conjuncția rămâne evident falsă.",
        },
      },
      example: {
        prompt: "„Înveți și repeți materia.”",
        formula: "p ∧ q",
        note: "Ambele propoziții trebuie să fie adevărate ca întreaga formulă să rămână adevărată.",
      },
    },
    {
      id: "disjunction",
      symbol: "p ∨ q",
      label: "Disjuncție inclusivă",
      pRole: "o posibilitate de adevăr",
      qRole: "a doua posibilitate de adevăr",
      relationText:
        "În disjuncția inclusivă, este suficient ca una dintre propoziții să fie adevărată pentru ca formula să fie adevărată.",
      fastRule: "Formula este falsă doar când p și q sunt ambele false.",
      rowExplanations: {
        tt: "Ambele sunt adevărate, deci și disjuncția este adevărată.",
        tf: "p este adevărată, iar asta este suficient pentru ca p ∨ q să fie adevărată.",
        ft: "q este adevărată, iar asta este suficient pentru ca p ∨ q să fie adevărată.",
        ff: "Acesta este singurul caz în care nici p, nici q nu susțin formula, deci disjuncția este falsă.",
      },
      rowExamples: {
        tt: {
          prompt: "Mergi la curs și înveți și acasă.",
          formula: "p = 1, q = 1 => p ∨ q = 1",
          note: "Disjuncția inclusivă rămâne adevărată chiar dacă le faci pe ambele.",
        },
        tf: {
          prompt: "Mergi la curs, dar nu înveți acasă.",
          formula: "p = 1, q = 0 => p ∨ q = 1",
          note: "Este suficient ca una dintre cele două variante să fie adevărată.",
        },
        ft: {
          prompt: "Nu mergi la curs, dar înveți acasă.",
          formula: "p = 0, q = 1 => p ∨ q = 1",
          note: "Și aici o singură propoziție adevărată este suficientă pentru a salva formula.",
        },
        ff: {
          prompt: "Nici nu mergi la curs, nici nu înveți acasă.",
          formula: "p = 0, q = 0 => p ∨ q = 0",
          note: "Doar în lipsa ambelor posibilități disjuncția devine falsă.",
        },
      },
      linkedSchemes: [
        {
          name: "Modus Tollendo-Ponens",
          note: "Din p ∨ q, dacă elimini p prin ¬p, rămâne q.",
        },
        {
          name: "Modus Ponendo-Tollens",
          note: "Funcționează doar pentru disjuncția exclusivă: dacă p este adevărat, q trebuie exclus.",
        },
      ],
      example: {
        prompt: "„Mergi la curs sau înveți acasă.”",
        formula: "p ∨ q",
        note: "Formula rămâne adevărată chiar dacă ajungi să le faci pe ambele, pentru că aici disjuncția este inclusivă.",
      },
    },
    {
      id: "implication",
      symbol: "p → q",
      label: "Implicație",
      pRole: "antecedentul, adică condiția suficientă",
      qRole: "consecventul, adică ceea ce trebuie să urmeze",
      relationText:
        "În implicație, p promite că dacă este adevărată, atunci și q trebuie să fie adevărată. Relația critică este: din p adevărat nu ai voie să ajungi la q fals.",
      fastRule: "Implicația este falsă doar în cazul p = adevărat și q = fals.",
      rowExplanations: {
        tt: "Promisiunea este respectată: dacă p are loc și q are loc, implicația este adevărată.",
        tf: "Aici apare singurul eșec logic: p este adevărată, dar q nu urmează. De aceea implicația devine falsă.",
        ft: "Când p este falsă, implicația nu este încălcată. Formula rămâne adevărată.",
        ff: "Și aici p este falsă, deci nu există încălcarea relației «dacă p, atunci q». Implicația rămâne adevărată.",
      },
      rowExamples: {
        tt: {
          prompt: "Înveți și promovezi.",
          formula: "p = 1, q = 1 => p → q = 1",
          note: "Condiția este îndeplinită și rezultatul apare, deci promisiunea este respectată.",
        },
        tf: {
          prompt: "Înveți, dar nu promovezi.",
          formula: "p = 1, q = 0 => p → q = 0",
          note: "Acesta este singurul caz care rupe implicația: ai antecedent adevărat și consecvent fals.",
        },
        ft: {
          prompt: "Nu înveți, dar totuși promovezi din altă sursă de punctaj.",
          formula: "p = 0, q = 1 => p → q = 1",
          note: "Pentru că p nu se activează, regula nu este încălcată, chiar dacă q apare.",
        },
        ff: {
          prompt: "Nu înveți și nu promovezi.",
          formula: "p = 0, q = 0 => p → q = 1",
          note: "Nici aici nu există o promisiune încălcată, pentru că antecedentul este fals.",
        },
      },
      linkedSchemes: [
        {
          name: "Modus Ponens",
          note: "Activezi antecedentul p, iar regula obligă q.",
        },
        {
          name: "Modus Tollens",
          note: "Dacă q cade, cade și p, pentru că p nu are voie să ducă la q fals.",
        },
        {
          name: "Afirmarea consecventului",
          note: "Este capcana clasică: q adevărat nu garantează că p a fost cauza.",
        },
        {
          name: "Negarea antecedentului",
          note: "Este capcana clasică: ¬p nu obligă ¬q, fiindcă q poate veni și din altă parte.",
        },
      ],
      example: {
        prompt: "„Dacă înveți, atunci promovezi.”",
        formula: "p → q",
        note: "Singurul caz interzis este să ai p adevărat și q fals în același timp.",
      },
    },
    {
      id: "equivalence",
      symbol: "p ↔ q",
      label: "Echivalență",
      pRole: "prima propoziție care trebuie comparată",
      qRole: "a doua propoziție care trebuie comparată",
      relationText:
        "În echivalență, p și q trebuie să aibă aceeași valoare de adevăr. Formula verifică dacă ele merg împreună.",
      fastRule: "Echivalența este adevărată când p și q au aceeași valoare.",
      rowExplanations: {
        tt: "Ambele sunt adevărate, deci au aceeași valoare și echivalența este adevărată.",
        tf: "Valorile diferă, deci echivalența este falsă.",
        ft: "Valorile diferă, deci echivalența este falsă.",
        ff: "Ambele sunt false, deci au aceeași valoare și echivalența este adevărată.",
      },
      rowExamples: {
        tt: {
          prompt: "Iei punctajul minim și promovezi.",
          formula: "p = 1, q = 1 => p ↔ q = 1",
          note: "Cele două propoziții merg împreună, deci echivalența rămâne adevărată.",
        },
        tf: {
          prompt: "Iei punctajul minim, dar nu promovezi.",
          formula: "p = 1, q = 0 => p ↔ q = 0",
          note: "Aici valorile nu mai coincid, deci echivalența cade.",
        },
        ft: {
          prompt: "Nu iei punctajul minim, dar totuși promovezi.",
          formula: "p = 0, q = 1 => p ↔ q = 0",
          note: "Și aici valorile diferă, deci relația de echivalență este falsă.",
        },
        ff: {
          prompt: "Nu iei punctajul minim și nu promovezi.",
          formula: "p = 0, q = 0 => p ↔ q = 1",
          note: "Ambele au aceeași valoare, chiar dacă sunt false, deci echivalența rămâne adevărată.",
        },
      },
      linkedSchemes: [
        {
          name: "Două implicații lipite",
          note: "Echivalența se înțelege mai ușor dacă o vezi ca p → q și q → p în același timp.",
        },
      ],
      example: {
        prompt: "„Promovezi dacă și numai dacă iei punctajul minim.”",
        formula: "p ↔ q",
        note: "Cele două propoziții trebuie să meargă împreună: aceeași valoare de adevăr în fiecare rând.",
      },
    },
  ],
}

const argumentSchemesBlock = {
  type: "argument_schemes",
  families: [
    {
      id: "implication",
      label: "Implicație",
      formula: "p → q",
      description:
        "Aici legi o condiție de un rezultat. Schemele valide păstrează direcția acestei legături; capcanele o inversează sau o rup.",
    },
    {
      id: "disjunction",
      label: "Disjuncție",
      formula: "p ∨ q / p ⊻ q",
      description:
        "Aici lucrezi cu opțiuni. Ori elimini una și rămâne cealaltă, ori alegi una într-o disjuncție exclusivă și o blochezi pe cealaltă.",
    },
  ],
  schemes: [
    {
      id: "modus-ponens",
      familyId: "implication",
      name: "Modus Ponens",
      verdict: "valid",
      premises: ["p → q", "p"],
      conclusion: "q",
      natural: "Dacă p, atunci q. p. Deci q.",
      intuition:
        "Pornești de la regulă și apoi activezi exact condiția p. Nu mai rămâne loc să pierzi pe q.",
      supportHint:
        "Ambele premise sunt adevărate și concluzia rămâne adevărată, exact cum cere regula implicației.",
      counterexampleHint: "Nu există un contraexemplu real pentru această schemă.",
    },
    {
      id: "modus-tollens",
      familyId: "implication",
      name: "Modus Tollens",
      verdict: "valid",
      premises: ["p → q", "¬q"],
      conclusion: "¬p",
      natural: "Dacă p, atunci q. Nu q. Deci nu p.",
      intuition:
        "Dacă regula spune că p l-ar forța pe q, iar q lipsește, înseamnă că p nu a avut loc.",
      supportHint:
        "Când q este fals și implicația rămâne adevărată, p nu poate fi adevărat.",
      counterexampleHint:
        "Nu există un rând cu premise adevărate și concluzie falsă pentru această schemă.",
    },
    {
      id: "affirming-the-consequent",
      familyId: "implication",
      name: "Afirmarea consecventului",
      verdict: "invalid",
      premises: ["p → q", "q"],
      conclusion: "p",
      natural: "Dacă p, atunci q. q. Deci p.",
      intuition:
        "Faptul că q este adevărat nu spune din ce cauză a apărut. q poate fi adevărat și fără p.",
      supportHint:
        "Unele rânduri par să confirme schema, dar asta nu este suficient pentru validitate.",
      counterexampleHint:
        "Rândul selectat arată capcana: regula și q sunt adevărate, dar p poate lipsi.",
    },
    {
      id: "denying-the-antecedent",
      familyId: "implication",
      name: "Negarea antecedentului",
      verdict: "invalid",
      premises: ["p → q", "¬p"],
      conclusion: "¬q",
      natural: "Dacă p, atunci q. Nu p. Deci nu q.",
      intuition:
        "Din faptul că p nu apare nu rezultă că q dispare; q poate avea o altă sursă.",
      supportHint:
        "Unele rânduri lasă impresia că merge, dar validitatea cere să meargă pe toate rândurile relevante.",
      counterexampleHint:
        "Aici vezi ruptura: implicația rămâne adevărată și ¬p este adevărat, dar q poate fi totuși adevărat.",
    },
    {
      id: "modus-tollendo-ponens",
      familyId: "disjunction",
      name: "Modus Tollendo-Ponens",
      verdict: "valid",
      premises: ["p ∨ q", "¬p"],
      conclusion: "q",
      natural: "p sau q. Nu p. Deci q.",
      intuition:
        "Disjuncția lasă două uși deschise. A doua premisă închide ușa lui p, deci rămâi cu q.",
      supportHint:
        "Când p este eliminat, singura variantă care mai poate susține disjuncția este q.",
      counterexampleHint:
        "Nu există un contraexemplu pentru această schemă în disjuncția inclusivă.",
    },
    {
      id: "modus-ponendo-tollens",
      familyId: "disjunction",
      name: "Modus Ponendo-Tollens",
      verdict: "valid",
      premises: ["p ⊻ q", "p"],
      conclusion: "¬q",
      natural: "Fie p, fie q, dar nu ambele. p. Deci nu q.",
      intuition:
        "Merge doar dacă prima premisă este disjuncție exclusivă: alegerea lui p îl exclude automat pe q.",
      supportHint:
        "Exact asta înseamnă disjuncția exclusivă: una intră, cealaltă iese.",
      counterexampleHint:
        "Dacă ai avea doar p ∨ q, schema nu ar mai fi sigură; de aceea exclusivitatea este esențială.",
    },
  ],
}

export const lesson4EditorialTheory = {
  meta: {
    title: "Lecția 4 - Propoziții, formule și verificarea argumentelor fără haos",
    summary:
      "Parcurgi conectorii, tabelele de adevăr și schemele clasice într-un flux continuu, cu explicații scurte, diacritice corecte și exemple pe care le poți folosi imediat la examen.",
    hideTranscript: true,
  },
  chapters: [
    {
      id: "connectors",
      stepLabel: "Capitolul 1",
      title: "Ce este o propoziție și cum recunoști conectorii",
      auxLayout: "below",
      lead:
        "Înainte de formule, fixezi tipul de enunț și operatorul care leagă propozițiile între ele.",
      paragraphs: [
        "O propoziție este un enunț care poate fi evaluat ca adevărat sau fals. Întrebările, comenzile și exclamațiile pot fi importante în limbajul obișnuit, dar nu intră în calculul logic propozițional.",
        "Din două sau mai multe propoziții simple obții o propoziție compusă prin conectori. În practică, examenul testează mai ales recunoașterea markerilor de limbaj: «nu», «și», «sau», «dacă..., atunci...» și «dacă și numai dacă».",
        "Reflexul bun este să separi mai întâi propozițiile simple, apoi să alegi operatorul principal. Dacă sari direct la formulă, greșești exact acolo unde apar capcanele: la «sau», la implicație și la formulările care par inverse, dar nu sunt.",
      ],
      visual: {
        kind: "operator-map",
        title: "Harta rapidă a conectorilor",
        description:
          "Când vezi markerul de limbaj, poți ghici imediat forma logică pe care trebuie să o scrii.",
        items: [
          {
            symbol: "¬",
            label: "Negație",
            cue: "„nu”, „nu este cazul că...”",
            rule: "Inversează valoarea propoziției inițiale.",
          },
          {
            symbol: "∧",
            label: "Conjuncție",
            cue: "„și”, „dar”, „iar”",
            rule: "Este adevărată doar dacă ambele propoziții sunt adevărate.",
          },
          {
            symbol: "∨",
            label: "Disjuncție inclusivă",
            cue: "„sau”, dacă nu apare excluderea clară",
            rule: "Este falsă doar când ambele propoziții sunt false.",
          },
          {
            symbol: "⊻",
            label: "Disjuncție exclusivă",
            cue: "„fie..., fie..., dar nu ambele”",
            rule: "Este adevărată când exact una dintre propoziții este adevărată.",
          },
          {
            symbol: "→",
            label: "Implicație",
            cue: "„dacă..., atunci...”, „doar dacă”",
            rule: "Este falsă doar când p este adevărat și q este fals.",
          },
          {
            symbol: "↔",
            label: "Echivalență",
            cue: "„dacă și numai dacă”",
            rule: "Este adevărată când propozițiile au aceeași valoare.",
          },
        ],
      },
      examples: [
        {
          label: "Conjuncție",
          prompt: "„Plouă și bate vântul.”",
          answer: "p ∧ q",
          explanation: "Leagă două propoziții care trebuie citite împreună.",
        },
        {
          label: "Implicație",
          prompt: "„Dacă înveți, atunci promovezi.”",
          answer: "p → q",
          explanation: "p este condiția suficientă, iar q este efectul care trebuie să urmeze.",
        },
      ],
      supportBlocks: [
        {
          type: "table",
          columns: [
            "Operator",
            "Simbol",
            "Când e adevărat",
            "Cazul care îl rupe",
            "Cum îl recunoști în limbaj",
            "Exemplu rapid",
          ],
          rows: [
            [
              "Conjuncție",
              "p ∧ q",
              "doar dacă p și q sunt ambele adevărate",
              "orice rând în care apare cel puțin un fals",
              "„și”, „dar”, „iar”",
              "„Înveți și repeți materia.”",
            ],
            [
              "Disjuncție inclusivă",
              "p ∨ q",
              "dacă cel puțin una dintre propoziții este adevărată",
              "singurul rând cu p = 0 și q = 0",
              "„sau”, dacă excluderea nu este spusă clar",
              "„Mergi la curs sau înveți acasă.”",
            ],
            [
              "Implicație",
              "p → q",
              "în toate cazurile, cu excepția unuia singur",
              "rândul în care p = 1 și q = 0",
              "„dacă..., atunci...”, „doar dacă”",
              "„Dacă înveți, atunci promovezi.”",
            ],
            [
              "Echivalență",
              "p ↔ q",
              "când p și q au aceeași valoare",
              "rândurile în care p și q diferă",
              "„dacă și numai dacă”",
              "„Promovezi dacă și numai dacă iei punctajul minim.”",
            ],
          ],
          footnote:
            "Compari operatorii după condiția de adevăr și după singurul tip de rând care îi diferențiază cel mai repede la examen.",
        },
      ],
      takeaways: [
        "O propoziție trebuie să poată primi o valoare de adevăr.",
        "Nu alegi operatorul după impresie, ci după markerii de limbaj.",
        "Dacă exclusivitatea nu este menționată clar, «sau» rămâne inclusiv.",
      ],
      examNote: {
        tone: "warning",
        label: "Capcană de examen",
        title: "„Sau” nu înseamnă automat exclusiv",
        text: "Dacă enunțul nu spune clar că variantele se exclud, scrii ∨, nu ⊻. Mulți itemi se rup exact aici.",
      },
      interactive: {
        type: "pq_relation",
        title: "Vezi cum se schimbă rezultatul pe fiecare rând",
        description:
          "Exploratorul de mai jos îți arată ce rămâne constant la fiecare conector și unde apare singurul caz care îl face fals.",
        block: pqRelationBlock,
        variant: "embedded",
      },
    },
    {
      id: "truth-tables",
      stepLabel: "Capitolul 2",
      title: "Cum folosești tabelele de adevăr",
      lead:
        "Tabelul de adevăr este metoda sigură atunci când vrei certitudine, nu aproximări.",
      paragraphs: [
        "Îl folosești când formula are puține variabile și vrei să vezi toate cazurile posibile. Pentru două variabile ai patru rânduri; pentru trei, opt. Asta îți oferă control complet asupra formulei.",
        "Ordinea pașilor contează. Mai întâi scrii combinațiile de valori, apoi calculezi coloanele intermediare și abia la final operatorul principal. Așa nu amesteci calculele locale cu rezultatul final.",
        "După ultima coloană poți decide rapid dacă formula este tautologie, contradicție sau contingentă. Exact aceeași disciplină te ajută și când verifici un argument scurt prin tabel de adevăr.",
      ],
      visual: {
        kind: "truth-flow",
        title: "Algoritmul scurt pentru un tabel corect",
        description:
          "Urmezi aceeași succesiune de fiecare dată și eviți să sari direct la operatorul principal.",
        steps: [
          {
            label: "1. Notezi variabilele",
            text: "Stabilești p, q, r și verifici de câte coloane de bază ai nevoie.",
          },
          {
            label: "2. Scrii toate combinațiile",
            text: "Pentru n variabile ai 2^n rânduri. Nu inventezi cazuri și nu omiți nimic.",
          },
          {
            label: "3. Calculezi coloanele intermediare",
            text: "Rezolvi negațiile și grupările locale înainte de operatorul principal.",
          },
          {
            label: "4. Citești ultima coloană",
            text: "Acolo decizi dacă formula este tautologie, contradicție sau contingentă.",
          },
        ],
        classifications: [
          { label: "Tautologie", detail: "ultima coloană are doar 1" },
          { label: "Contradicție", detail: "ultima coloană are doar 0" },
          { label: "Contingentă", detail: "ultima coloană are și 1, și 0" },
        ],
      },
      examples: [
        {
          label: "Caz critic",
          prompt: "Pentru p → q, dacă p = 1 și q = 0",
          answer: "formula este falsă",
          explanation: "Acesta este singurul rând care rupe implicația.",
        },
        {
          label: "Clasificare",
          prompt: "Dacă ultima coloană a formulei este 1, 1, 1, 1",
          answer: "tautologie",
          explanation: "Formula rămâne adevărată în toate cazurile posibile.",
        },
      ],
      takeaways: [
        "Nu începi cu operatorul principal; întâi calculezi tot ce îl alimentează.",
        "Numărul de rânduri este fix: 2^n.",
        "Ultima coloană îți spune tipul formulei.",
      ],
      examNote: {
        tone: "info",
        label: "Greșeală frecventă",
        title: "Operatorul principal se calculează ultimul",
        text: "Dacă îl rezolvi prea devreme, amesteci valorile și tot tabelul devine nesigur, chiar dacă ideea de bază era corectă.",
      },
    },
    {
      id: "equivalences",
      stepLabel: "Capitolul 3",
      title: "Echivalențele pe care trebuie să le știi imediat",
      copyWidth: "wide",
      lead:
        "Unele transformări merită recunoscute instant, pentru că îți economisesc timp și îți curăță formula.",
      paragraphs: [
        "În loc să reconstruiești de fiecare dată un tabel de adevăr, folosești echivalențe stabile. Ele păstrează valoarea de adevăr și îți permit să rescrii formula într-o formă mai ușor de citit.",
        "Implicația și echivalența apar foarte des la examen. La fel de importante sunt legile lui De Morgan și dubla negație, pentru că intră în aproape orice transformare serioasă.",
        "Când vezi o formulă încărcată, nu încerca să o memorezi ca pe un desen. Rupe-o în bucăți și verifică dacă recunoști una dintre transformările clasice de mai jos.",
      ],
      visual: {
        kind: "formula-strip",
        layout: "full",
        title: "Banda de formule pe care merită să o știi pe dinafară",
        description:
          "Aceste echivalențe apar repetat în grile și în simplificări, deci trebuie să le citești fără ezitare.",
        items: [
          {
            label: "Implicația",
            formula: "p → q ≡ ¬p ∨ q",
            explanation: "Rescrii condiția sub forma «nu p sau q».",
          },
          {
            label: "Echivalența",
            formula: "p ↔ q ≡ (p → q) ∧ (q → p)",
            explanation: "O vezi ca două implicații care merg în ambele sensuri.",
          },
          {
            label: "De Morgan",
            formula: "¬(p ∧ q) ≡ ¬p ∨ ¬q",
            explanation: "Negarea unei conjuncții devine disjuncția negațiilor.",
          },
          {
            label: "De Morgan",
            formula: "¬(p ∨ q) ≡ ¬p ∧ ¬q",
            explanation: "Negarea unei disjuncții devine conjuncția negațiilor.",
          },
          {
            label: "Dublă negație",
            formula: "¬(¬p) ≡ p",
            explanation: "Două negații succesive se anulează.",
          },
        ],
      },
      examples: [
        {
          label: "Implicația rescrisă",
          prompt: "„Dacă înveți, promovezi.”",
          answer: "p → q ≡ ¬p ∨ q",
          explanation: "Poți citi și: «ori nu înveți, ori promovezi».",
        },
        {
          label: "De Morgan",
          prompt: "„Nu este adevărat că plouă sau ninge.”",
          answer: "¬(p ∨ q) ≡ ¬p ∧ ¬q",
          explanation: "Negi fiecare propoziție și schimbi operatorul dintre ele.",
        },
      ],
      takeaways: [
        "Echivalența păstrează valoarea de adevăr a formulei.",
        "De Morgan apare des exact în expresiile unde elevii inversează greșit operatorii.",
        "Nu memorezi izolat; citești formula și sensul ei logic împreună.",
      ],
      examNote: {
        tone: "warning",
        label: "Capcană de examen",
        title: "Nu schimbi doar semnele, schimbi și operatorul",
        text: "Din ¬(p ∨ q) nu obții ¬p ∨ ¬q, ci ¬p ∧ ¬q. Asta este una dintre cele mai comune erori din lecția 4.",
      },
    },
    {
      id: "translation",
      stepLabel: "Capitolul 4",
      title: "Traducerea din limbaj natural în formulă",
      lead:
        "Traducerea corectă începe din limbaj și se termină în formulă, nu invers.",
      paragraphs: [
        "Mai întâi numerotezi propozițiile simple: p, q, r. Abia după aceea urmărești markerii de limbaj și vezi cine este operatorul principal al enunțului.",
        "«Dacă p, atunci q» și «p doar dacă q» au aceeași structură logică: p → q. Capcana apare când citești «numai dacă» ca pe o inversare automată, deși sensul logic rămâne același.",
        "La «sau» păstrezi disjuncția inclusivă dacă enunțul nu spune clar că variantele se exclud. Exclusivitatea trebuie semnalată explicit prin formule de tipul «fie..., fie..., dar nu ambele».",
      ],
      visual: {
        kind: "translation-map",
        title: "Marcaj de limbaj → operator logic",
        description:
          "Nu sari direct la simbol. Leagă mai întâi expresia din limbajul natural de forma ei logică.",
        rows: [
          { marker: "„nu”", symbol: "¬", detail: "introduce o negație" },
          { marker: "„și / dar / iar”", symbol: "∧", detail: "leagă două propoziții simultan adevărate" },
          { marker: "„sau”", symbol: "∨", detail: "rămâne inclusivă dacă excluderea nu este explicită" },
          { marker: "„dacă..., atunci...”", symbol: "→", detail: "leagă antecedentul de consecvent" },
          { marker: "„doar dacă / numai dacă”", symbol: "→", detail: "p doar dacă q înseamnă p → q" },
          { marker: "„dacă și numai dacă”", symbol: "↔", detail: "cere aceeași valoare pentru ambele propoziții" },
        ],
        trap: {
          prompt: "„Promovezi numai dacă înveți.”",
          answer: "p → q",
          detail: "p = promovezi, q = înveți. Nu inversezi ordinea doar pentru că apare «numai».",
        },
      },
      examples: [
        {
          label: "Doar dacă",
          prompt: "„Intri în examen doar dacă ai actul de identitate.”",
          answer: "p → q",
          explanation: "p = intri în examen, q = ai actul. Formula nu se inversează.",
        },
        {
          label: "Exclusivitate",
          prompt: "„Fie mergi la curs, fie rămâi acasă, dar nu ambele.”",
          answer: "p ⊻ q",
          explanation: "Expresia «dar nu ambele» obligă disjuncția exclusivă.",
        },
      ],
      takeaways: [
        "Notezi întâi propozițiile simple, apoi cauți operatorul principal.",
        "«Doar dacă» și «dacă..., atunci...» se traduc în aceeași direcție logică.",
        "La disjuncție, exclusivitatea trebuie spusă clar.",
      ],
      examNote: {
        tone: "info",
        label: "Exemplu de examen",
        title: "„Numai dacă” nu inversează formula",
        text: "Dacă propoziția spune «treci examenul numai dacă înveți», partea dinainte rămâne antecedentul: p → q.",
      },
    },
    {
      id: "validity",
      stepLabel: "Capitolul 5",
      title: "Adevăr, validitate, fracții și verificare rapidă",
      lead:
        "Adevărul aparține propozițiilor; validitatea aparține formei argumentului.",
      paragraphs: [
        "Un argument este valid dacă nu există niciun caz în care premisele să fie adevărate, iar concluzia falsă. Nu contează dacă propozițiile vorbesc despre drept, vreme sau sport; contează forma inferenței.",
        "De aceea schemele clasice, numite și «fracții», merită recunoscute imediat. Modus Ponens și Modus Tollens sunt valide, dar afirmarea consecventului și negarea antecedentului rămân capcane.",
        "Când schema nu îți sare în ochi, folosești testul prin contraexemplu. Presupui premisele adevărate și concluzia falsă; dacă apare contradicție, argumentul este valid. Dacă nu apare, ai găsit ruptura.",
      ],
      visual: {
        kind: "validation-flow",
        layout: "feature",
        title: "Cum verifici repede un argument",
        description:
          "Acesta este traseul scurt atunci când nu recunoști imediat dacă ai o schemă validă sau o capcană.",
        steps: [
          {
            label: "Presupui ruptura",
            text: "Pui toate premisele pe adevărat și concluzia pe fals.",
          },
          {
            label: "Propagi valorile",
            text: "Mergi din concluzie înapoi spre premise și vezi ce impune fiecare operator.",
          },
          {
            label: "Cauți contradicția",
            text: "Dacă aceeași variabilă e forțată și la 1, și la 0, ruptura nu poate exista.",
          },
          {
            label: "Dai verdictul",
            text: "Contradicție înseamnă argument valid; lipsa ei înseamnă contraexemplu și deci nevaliditate.",
          },
        ],
      },
      examples: [
        {
          label: "Schemă validă",
          prompt: "„Dacă înveți, promovezi. Înveți. Deci promovezi.”",
          answer: "(p → q), p ⟹ q",
          explanation: "Aceasta este forma clasică a lui Modus Ponens.",
        },
        {
          label: "Capcană",
          prompt: "„Dacă înveți, promovezi. Promovezi. Deci ai învățat.”",
          answer: "(p → q), q ⟹ p",
          explanation: "Sună bine în limbaj natural, dar logic rămâne nevalidă.",
        },
      ],
      takeaways: [
        "Adevărul ține de conținut; validitatea ține de structură.",
        "Nu toate schemele care sună bine sunt valide.",
        "Contraexemplul este testul scurt când nu recunoști imediat fracția.",
      ],
      examNote: {
        tone: "warning",
        label: "Capcană de examen",
        title: "q adevărat nu dovedește că p a fost cauza",
        text: "Afirmarea consecventului arată convingător în limbaj natural, dar logic rămâne o eroare: q poate veni și din altă sursă.",
      },
      interactive: {
        type: "argument_schemes",
        title: "Testează fracțiile clasice pe rânduri de adevăr",
        description:
          "Alege familia, apoi schema, și vezi unde se confirmă sau unde se rupe raționamentul.",
        block: argumentSchemesBlock,
        variant: "embedded",
      },
    },
    {
      id: "demonstration",
      stepLabel: "Capitolul 6",
      title: "Demonstrație, argumentare specială și erori de supoziție",
      lead:
        "O demonstrație bună nu înseamnă doar concluzie corectă, ci și drum corect până la ea.",
      paragraphs: [
        "O demonstrație are trei părți: teza, fundamentul și procedeul de derivare. Dacă una dintre ele lipsește, discursul poate părea convingător, dar nu mai este riguros.",
        "În argumentarea specială apar frecvent explicația, justificarea și interpretarea unor cazuri. Toate cer un sprijin explicit în premise sau în reguli deja acceptate, nu doar formulări elegante.",
        "Erorile de supoziție neîntemeiată apar când introduci alternative false, premise nedovedite sau opoziții fabricate. În practică, asta rupe demonstrația chiar dacă formularea sună sigură și autoritară.",
        "La examen, forma scurtă și curată câștigă. Spui ce vrei să arăți, cu ce te sprijini și prin ce regulă ajungi la rezultat.",
      ],
      visual: {
        kind: "argument-architecture",
        layout: "feature",
        title: "Scheletul unei demonstrații clare",
        description:
          "Dacă știi unde se așază teza, fundamentul și procedura, vezi mai repede și unde apare eroarea.",
        pillars: [
          {
            label: "Teza",
            text: "Afirmația pe care vrei să o demonstrezi sau să o aperi.",
          },
          {
            label: "Fundamentul",
            text: "Premisele, definițiile sau regulile pe care ai voie să te sprijini.",
          },
          {
            label: "Procedeul",
            text: "Lanțul de inferențe prin care treci legitim de la fundament la teză.",
          },
        ],
        pitfalls: [
          "premisă ascunsă care nu a fost justificată",
          "alternativă falsă prezentată ca singura opțiune",
          "opoziție forțată între două idei care nu se exclud",
        ],
      },
      examples: [
        {
          label: "Demonstrație curată",
          prompt: "Teză: «argumentul este valid»; fundament: regulile implicației; procedeu: test prin contraexemplu.",
          answer: "teză + fundament + procedeu",
          explanation: "Aici se văd clar cele trei piese obligatorii ale demonstrației.",
        },
        {
          label: "Falsă dilemă",
          prompt: "„Ori ești de acord cu soluția mea, ori nu vrei binele proiectului.”",
          answer: "eroare de supoziție",
          explanation: "Sunt eliminate artificial variante reale dintre cele două extreme.",
        },
      ],
      takeaways: [
        "O demonstrație are nevoie de teză, fundament și procedeu.",
        "Nu orice discurs convingător este și logic bine construit.",
        "Erorile de supoziție apar când accepți premise sau alternative fără bază reală.",
      ],
      examNote: {
        tone: "info",
        label: "Capcană de argumentare",
        title: "Dacă alegerea e artificial îngustată, ai deja o problemă",
        text: "Când enunțul îți oferă doar două opțiuni și ignoră variante reale suplimentare, verifică imediat dacă nu ai o falsă dilemă.",
      },
    },
  ],
  recapChecklist: [
    "Separ propozițiile simple înainte să aleg formula finală.",
    "Identific operatorul principal din markerii de limbaj, nu din impresie.",
    "La tabelul de adevăr calculez întâi coloanele intermediare și abia la final operatorul principal.",
    "Recunosc instant implicația, echivalența, legile lui De Morgan și dubla negație.",
    "Nu confund adevărul propozițiilor cu validitatea argumentului.",
    "Când schema nu e clară, caut contraexemplul: premise adevărate și concluzie falsă.",
  ],
}
