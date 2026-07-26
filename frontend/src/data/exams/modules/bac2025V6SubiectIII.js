import { card } from "./card"

const syllogismRules = [
  "Intr-un silogism trebuie identificati termenii S, P si M.",
  "Figura fixeaza pozitia termenului mediu in premise.",
  "Validitatea se verifica prin distributie sau prin diagrama Venn, nu prin plauzibilitate verbala.",
]

const definitionRules = [
  "Definitia logica trebuie sa fie clara, nefigurata si adecvata.",
  "Definitul si definitorul trebuie sa fie convertibili sub raportul extensiunii.",
  "O definitie poate gresi prin metafora, prin prea larg sau prin prea ingust.",
]

export const v6SubiectIIIA = [
  card({
    reference: "III.A.a.1",
    marks: "2p",
    officialText:
      "a) Scrieti schemele de inferenta corespunzatoare modurilor silogistice date: eio-2.",
    titlu: "III.A.a.1 - Schema pentru eio-2",
    raspuns_corect: "PeM / SiM / SoP",
    de_ce_este_corect:
      "Figura a II-a are forma P-M in premisa majora, S-M in premisa minora si S-P in concluzie. Literele E-I-O fixeaza tipurile de propozitii pentru majora, minora si concluzie. Rezulta astfel schema PeM / SiM / SoP.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Fixez figura silogistica dupa pozitia termenului mediu.",
      "Aplic literele modului pe cele trei propozitii.",
      "Scriu fractiile silogistice in ordinea majora-minora-concluzie.",
    ],
    schema_logica: {
      tip: "mod silogistic",
      continut: ["figura II: P-M / S-M / S-P", "eio-2", "PeM / SiM / SoP"],
    },
    reprezentare_vizuala: [
      "Majora: P-M",
      "Minora: S-M",
      "Concluzie: S-P",
    ],
    step_by_step: [
      "Identific figura II.",
      "Pun E pe premisa majora: PeM.",
      "Pun I pe premisa minora: SiM.",
      "Pun O pe concluzie: SoP.",
    ],
    de_ce_nu: {
      a: "Nu folosesti figura I; in figura II termenul mediu este predicat in ambele premise.",
      b: "Nu inversezi ordinea majora-minora-concluzie.",
      c: "Nu schimbi literele modului; E, I si O trebuie respectate exact.",
      d: "Nu omiti termenul mediu M, fiindca el sustine inferenta mediata.",
    },
    capcana_frecventa:
      "Eroarea clasica este asezarea modului pe figura gresita. Literele nu sunt suficiente daca figura este ratata.",
  }),
  card({
    reference: "III.A.a.2",
    marks: "2p",
    officialText:
      "a) Scrieti schemele de inferenta corespunzatoare modurilor silogistice date: aaa-4.",
    titlu: "III.A.a.2 - Schema pentru aaa-4",
    raspuns_corect: "PaM / MaS / SaP",
    de_ce_este_corect:
      "Figura a IV-a are forma P-M in premisa majora, M-S in premisa minora si S-P in concluzie. Aplicand literele A-A-A asupra acestei figuri, obtinem PaM / MaS / SaP.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Pornesc de la figura IV.",
      "Pun literele A, A, A pe majora, minora si concluzie.",
      "Scriu fractiile in ordinea corecta.",
    ],
    schema_logica: {
      tip: "mod silogistic",
      continut: ["figura IV: P-M / M-S / S-P", "aaa-4", "PaM / MaS / SaP"],
    },
    reprezentare_vizuala: ["Majora: P-M", "Minora: M-S", "Concluzie: S-P"],
    step_by_step: [
      "Identific figura IV.",
      "Scriu majora A: PaM.",
      "Scriu minora A: MaS.",
      "Scriu concluzia A: SaP.",
    ],
    de_ce_nu: {
      a: "Nu confunzi figura IV cu figura I; in figura IV minora este M-S, nu S-M.",
      b: "Nu schimbi pozitia termenului major in majora.",
      c: "Nu alterezi literele modului; toate cele trei sunt A.",
      d: "Nu sari direct la verdictul de validitate; la punctul acesta se cere doar schema.",
    },
    capcana_frecventa:
      "Figura IV este adesea confundata cu figura I deoarece concluzia are tot forma S-P. Diferenta e in premise.",
  }),
  card({
    reference: "III.A.b",
    marks: "2p",
    officialText:
      "b) Construiti, in limbaj natural, un silogism care sa corespunda uneia dintre schemele de inferenta scrise la subpunctul a).",
    titlu: "III.A.b - Un silogism natural pentru unul dintre moduri",
    raspuns_corect:
      "Exemplu pentru eio-2: Nicio reptila nu este mamifer. Unele animale de companie sunt mamifere. Deci unele animale de companie nu sunt reptile.",
    de_ce_este_corect:
      "Exemplul respecta schema PeM / SiM / SoP. Premisa majora este de tip E, premisa minora este de tip I, iar concluzia este de tip O, cu termenii asezati conform figurii a II-a.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Aleg mai intai o schema silogistica deja scrisa corect.",
      "Asociez termeni concreti pentru S, P si M.",
      "Verific daca propozitiile naturale pastreaza forma logica a schemei.",
    ],
    schema_logica: {
      tip: "instantiere",
      continut: ["PeM", "SiM", "SoP"],
    },
    reprezentare_vizuala: [
      "P = reptile",
      "M = mamifere",
      "S = animale de companie",
    ],
    step_by_step: [
      "Aleg schema eio-2.",
      "Fixez termenii concreti pentru P, M si S.",
      "Compun majora E.",
      "Compun minora I.",
      "Derivez concluzia O.",
    ],
    de_ce_nu: {
      a: "Nu este suficient ca propozitiile sa fie adevarate; ele trebuie sa respecte si pozitia termenilor.",
      b: "Nu schimbi tipul propozitiilor fata de E-I-O.",
      c: "Nu folosesti termeni concreti care inversa raporturile cerute de schema.",
      d: "Nu construiesti concluzia inainte sa fixezi corect premisele.",
    },
    capcana_frecventa:
      "Multi elevi scriu trei enunturi plauzibile, dar rateaza figura sau tipul de propozitie cerut de schema.",
  }),
  card({
    reference: "III.A.c.1",
    marks: "4p",
    officialText:
      "c) Verificati explicit, prin metoda diagramelor Venn, validitatea modurilor silogistice date, precizand totodata decizia rezultata din reprezentarea grafica: eio-2.",
    titlu: "III.A.c.1 - Verificarea prin Venn a lui eio-2",
    raspuns_corect: "eio-2 este valid.",
    de_ce_este_corect:
      "Majora E, PeM, goleste intersectia P-M. Minora I, SiM, plaseaza existenta intr-o zona comuna lui S si M. Cum zona S-M-P este deja exclusa prin majora, semnul de existenta ramane in S-M-nonP. Aceasta obliga concluzia SoP. Validitatea este deci necesara, nu doar posibila.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Umbresc mai intai zonele vide impuse de premisele universale.",
      "Apoi plasez existenta ceruta de premisele particulare.",
      "Verific daca desenul forteaza sau nu concluzia.",
    ],
    schema_logica: {
      tip: "verificare Venn",
      continut: ["PeM", "SiM", "SoP", "valid"],
    },
    reprezentare_vizuala: [
      "P intersect M = vida",
      "x in S intersect M",
      "x nu poate intra in P",
    ],
    step_by_step: [
      "Marchez ca vida intersectia P-M.",
      "Plasez x in S-M.",
      "Zona S-M-P este interzisa.",
      "x ramane in S-nonP.",
      "Rezulta SoP si verdictul de validitate.",
    ],
    de_ce_nu: {
      a: "Nu notezi verdictul doar din memorie; el trebuie sa rezulte din diagrama.",
      b: "Nu plasezi x inainte de umbrirea zonelor vide.",
      c: "Nu confunzi o concluzie posibila cu una necesara; Venn cere fortare grafica.",
      d: "Nu omiti explicatia pozitiei lui x fata de P.",
    },
    capcana_frecventa:
      "Unii elevi deseneaza corect premisele, dar nu explica de ce x este obligat sa ramana in afara lui P.",
  }),
  card({
    reference: "III.A.c.2",
    marks: "4p",
    officialText:
      "c) Verificati explicit, prin metoda diagramelor Venn, validitatea modurilor silogistice date, precizand totodata decizia rezultata din reprezentarea grafica: aaa-4.",
    titlu: "III.A.c.2 - Verificarea prin Venn a lui aaa-4",
    raspuns_corect: "aaa-4 este nevalid.",
    de_ce_este_corect:
      "Din premisele PaM si MaS rezulta anumite incluziuni partiale, dar diagrama nu forteaza concluzia SaP in toate modelele posibile. Exista configuratii compatibile cu premisele in care S nu este inclus integral in P. Ceea ce nu este necesar nu este valid silogistic.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Reperez relatiile de incluziune impuse de premise.",
      "Verific daca desenul obliga integral concluzia.",
      "Daca ramane deschisa o configuratie alternativa, modulul este nevalid.",
    ],
    schema_logica: {
      tip: "verificare Venn",
      continut: ["PaM", "MaS", "SaP", "nevalid"],
    },
    reprezentare_vizuala: [
      "Premise compatibile cu mai multe distributii ale lui S fata de P",
      "SaP nu este fortata",
    ],
    step_by_step: [
      "Reprezint premisele de tip A.",
      "Observ ce zone sunt excluse de ele.",
      "Verific daca toata clasa S este obligata in P.",
      "Constat ca nu.",
      "Verdictul este nevalid.",
    ],
    de_ce_nu: {
      a: "Nu declar valid doar fiindca toate propozitiile sunt afirmative.",
      b: "Nu confund compatibilitatea concluziei cu necesitatea concluziei.",
      c: "Nu sari peste desenul Venn; exact acolo se vede lipsa fortei conclusive.",
      d: "Nu presupune ca orice AAA este automat valid intr-o figura data.",
    },
    capcana_frecventa:
      "Eroarea tipica este sa tratezi validitatea ca pe o simpla coerenta intuitiva a enunturilor. In logica, conteaza necesitatea concluziei.",
  }),
]

export const v6SubiectIIIB = [
  card({
    reference: "III.B",
    marks: "6p",
    officialText:
      'B. Construiti, atat in limbaj formal cat si in limbaj natural, un silogism valid, prin care sa justificati propozitia "Unii baieti care merg pe bicicleta sunt echipati cu casca de protectie."',
    titlu: "III.B - Silogism valid pentru concluzia data",
    raspuns_corect:
      "Formal: MaP / SiM / SiP.\nNatural: Toti membrii clubului de ciclism sunt echipati cu casca de protectie. Unii baieti care merg pe bicicleta sunt membri ai clubului de ciclism. Deci unii baieti care merg pe bicicleta sunt echipati cu casca de protectie.",
    de_ce_este_corect:
      "Concluzia ceruta este I: SiP. Un mod valid potrivit este Darii, adica AII in figura I: MaP / SiM / SiP. Termenul mediu 'membrii clubului de ciclism' leaga legitim subiectul concluziei de predicatul ei.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Pastrez neschimbata concluzia ceruta.",
      "Aleg un termen mediu care sa lege legitim S de P.",
      "Selectez un mod valid cunoscut pentru forma concluziei.",
    ],
    schema_logica: {
      tip: "Darii",
      continut: ["MaP", "SiM", "SiP"],
    },
    reprezentare_vizuala: [
      "Membrii clubului de ciclism subset echipati cu casca",
      "Unii baieti pe bicicleta apartin clubului",
      "=> unii baieti pe bicicleta sunt echipati",
    ],
    step_by_step: [
      "Fixez concluzia: SiP.",
      "Aleg termenul mediu M.",
      "Construiesc o majora A: MaP.",
      "Construiesc o minora I: SiM.",
      "Rezulta valid concluzia SiP.",
    ],
    de_ce_nu: {
      a: "Nu schimbi concluzia data de subiect; ea trebuie justificata exact, nu reformulata.",
      b: "Nu alegi un termen mediu care nu leaga logic S de P.",
      c: "Nu construiesti premise doar intuitive; ele trebuie sa sustina un mod valid.",
      d: "Nu confunda o simpla asociere tematica intre termeni cu o inferenta silogistica valida.",
    },
    capcana_frecventa:
      "Elevii aleg adesea termeni mediatori slabi sau schimba forma concluziei. Cel mai sigur este sa pornesti de la un mod valid cunoscut, aici Darii.",
  }),
]

const v6CRich = [
  {
    reference: "III.C.1",
    statement: "1. Premisa majora a silogismului este o propozitie universala afirmativa.",
    answer: "A",
    justification:
      "Premisa majora are forma A: 'Persoanele implicate in activitati extrascolare sunt voluntari'. Formula este SaP, deci universala afirmativa.",
    schema: ["premisa majora", "SaP", "A"],
  },
  {
    reference: "III.C.2",
    statement: "2. Premisele silogismului sunt propozitii negative.",
    answer: "F",
    justification:
      "Premisele nu sunt negative. Avem o propozitie de tip I si una de tip A, ambele afirmative. Negativitatea nu apare in niciuna dintre premise.",
    schema: ["premise", "I si A", "afirmative"],
  },
  {
    reference: "III.C.3",
    statement: "3. Termenul mediu este nedistribuit in ambele premise.",
    answer: "A",
    justification:
      "In propozitia I niciun termen nu este distribuit. In propozitia A, predicatul nu este distribuit. Cum termenul mediu ocupa exact aceste pozitii, el ramane nedistribuit in ambele premise.",
    schema: ["I: niciun termen distribuit", "A: predicat nedistribuit", "M nedistribuit"],
  },
  {
    reference: "III.C.4",
    statement: "4. Termenul major este distribuit in premisa, dar nedistribuit in concluzie.",
    answer: "F",
    justification:
      "Concluzia este de tip O, iar in O predicatul este distribuit. Cum termenul major apare ca predicat in concluzie, el este distribuit, nu nedistribuit.",
    schema: ["concluzie O", "predicat distribuit", "termen major distribuit"],
  },
]

export const v6SubiectIIIC = v6CRich.map((entry) =>
  card({
    reference: entry.reference,
    marks: "1p",
    officialText: entry.statement,
    titlu: `${entry.reference} - Adevarat sau fals`,
    raspuns_corect: entry.answer,
    de_ce_este_corect: entry.justification,
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Identific tipul fiecarei propozitii din silogism.",
      "Verific distributia termenului vizat de enunt.",
      "Abia apoi notez A sau F.",
    ],
    schema_logica: {
      tip: "verificare distributie",
      continut: entry.schema,
    },
    reprezentare_vizuala: entry.schema,
    step_by_step: [
      "Citesc enuntul de verificat.",
      "Recunosc forma sau distributia implicata.",
      "Compar cu regula formala pentru A, E, I sau O.",
      "Emit verdictul A/F.",
    ],
    de_ce_nu: {
      a: "Nu raspund intuitiv; la aceste itemi conteaza strict forma si distributia.",
      b: "Nu uit ca tipul propozitiei decide distributia termenilor.",
      c: "Nu confund termenul major cu termenul mediu sau cu subiectul concluziei.",
      d: "Nu notez A/F fara justificarea formulei logice implicate.",
    },
    capcana_frecventa:
      "Capcana tipica este evaluarea dupa sensul obisnuit al enuntului, nu dupa distributia formala a termenilor.",
  }),
)

export const v6SubiectIIID = [
  card({
    reference: "III.D.a",
    marks: "2p",
    officialText:
      'D. Se da urmatoarea definitie: "Satul e locul unde s-a nascut vesnicia."\n' +
      "a) Mentionati o regula de corectitudine pe care o incalca definitia data.",
    titlu: "III.D.a - Regula incalcata de definitia data",
    raspuns_corect:
      "Un raspuns acceptat: definitia incalca regula claritatii si preciziei, pentru ca este metaforica.",
    de_ce_este_corect:
      "Definitia logica trebuie sa fie proprie, clara si lipsita de figurativ. Formula 'locul unde s-a nascut vesnicia' are valoare stilistica, dar nu fixeaza riguros nici intensiunea, nici extensiunea termenului 'sat'. De aceea este incalcata regula claritatii.",
    tip_item: "Definitie logica",
    regula_generala: definitionRules,
    cum_gandesti: [
      "Verific daca formularea definitorului este clara sau figurata.",
      "Caut regula de definire direct afectata de eroarea observata.",
      "Formulez regula explicit, nu vag.",
    ],
    schema_logica: {
      tip: "eroare de definire",
      continut: ["definitie metaforica", "claritate incalcata"],
    },
    reprezentare_vizuala: ["Definit -> sat", "Definitor metaforic -> neclar"],
    step_by_step: [
      "Citesc definitia data.",
      "Observ caracterul metaforic al expresiei centrale.",
      "Verific daca formula este potrivita logic pentru definire.",
      "Conchid ca este incalcata claritatea si precizia.",
    ],
    de_ce_nu: {
      a: "Nu judec valoarea literara, ci corectitudinea logica a definitiei.",
      b: "Nu spun doar 'este frumoasa dar gresita'; trebuie numita regula incalcata.",
      c: "Nu confund metafora cu adecvarea prea larga sau prea ingusta daca nu arati explicit de ce.",
      d: "Nu transform raspunsul intr-o definitie noua; se cere doar regula incalcata.",
    },
    capcana_frecventa:
      "Elevii ezita sa respinga o formulare frumoasa. In logica definitiilor, expresia figurata este un viciu, nu o calitate.",
  }),
  card({
    reference: "III.D.b",
    marks: "2p",
    officialText:
      "b) Precizati o regula de corectitudine a definirii, alta decat cea mentionata la subpunctul a).",
    titlu: "III.D.b - O alta regula de corectitudine",
    raspuns_corect:
      "Un raspuns acceptat: regula adecvarii - definitia nu trebuie sa fie nici prea larga, nici prea ingusta.",
    de_ce_este_corect:
      "Cerinta solicita o alta regula valida a definirii, diferita de cea deja invocata la punctul a. Regula adecvarii este un raspuns standard si corect, pentru ca o definitie buna trebuie sa acopere exact extensiunea termenului definit.",
    tip_item: "Definitie logica",
    regula_generala: definitionRules,
    cum_gandesti: [
      "Retin regula folosita deja la punctul a.",
      "Aleg o regula distincta, dar standard in teoria definitiei.",
      "O formulez complet, nu doar prin nume.",
    ],
    schema_logica: {
      tip: "regula de definire",
      continut: ["adecvare", "nici prea larga", "nici prea ingusta"],
    },
    reprezentare_vizuala: ["Ext(definit) = Ext(definitor)"],
    step_by_step: [
      "Exclud regula deja folosita la punctul a.",
      "Selectez o alta regula valabila.",
      "Formulez explicit continutul ei: raport corect de extensiune.",
    ],
    de_ce_nu: {
      a: "Nu repet regula claritatii sub alta forma daca aceasta a fost deja folosita.",
      b: "Nu aleg o formulare vaga de tip 'sa fie buna' sau 'sa fie corecta'.",
      c: "Nu confund regulile definirii cu regulile clasificarii.",
      d: "Nu omiti explicatia regulii alese; baremul cere mai mult decat simpla eticheta.",
    },
    capcana_frecventa:
      "Raspunsurile vagi sau repetarea aceleiasi reguli de la punctul anterior pierd punctajul, chiar daca ideea generala pare corecta.",
  }),
  card({
    reference: "III.D.c",
    marks: "2p",
    officialText:
      'c) Construiti o definitie, avand ca definit termenul "satul", care sa incalce regula precizata la subpunctul b).',
    titlu: "III.D.c - Definitie care incalca regula aleasa la b",
    raspuns_corect:
      'Exemplu acceptat daca la b ai ales adecvarea: "Satul este orice asezare omeneasca."',
    de_ce_este_corect:
      "Daca la punctul b ai ales adecvarea, atunci definitia ceruta aici trebuie sa fie voit prea larga sau prea ingusta. Formula 'Satul este orice asezare omeneasca' este prea larga, deoarece include si realitati care nu sunt sate. Prin urmare, ea incalca exact regula mentionata la b.",
    tip_item: "Definitie logica",
    regula_generala: definitionRules,
    cum_gandesti: [
      "Pornesc de la regula aleasa la punctul b.",
      "Construiesc intentionat o definitie care sa o incalce.",
      "Verific daca eroarea este exact cea ceruta si nu alta.",
    ],
    schema_logica: {
      tip: "definitie inadecvata",
      continut: ["Ext(definitor) superset Ext(definit)"],
    },
    reprezentare_vizuala: [
      "sat subset asezare omeneasca",
      "nu orice asezare omeneasca este sat",
    ],
    step_by_step: [
      "Retin regula selectata la b.",
      "Aleg sa incalc adecvarea prin prea larg.",
      "Construiesc definitorul 'orice asezare omeneasca'.",
      "Verific: include mai mult decat termenul 'sat'.",
      "Rezulta o definitie incorecta controlat.",
    ],
    de_ce_nu: {
      a: "Nu oferi o definitie corecta; punctul cere explicit o definitie gresita controlat.",
      b: "Nu incalci o alta regula decat cea aleasa la b.",
      c: "Nu lasi eroarea doar implicita; ea trebuie sa fie usor de identificat.",
      d: "Nu alegi un exemplu care nu are legatura cu termenul 'sat'.",
    },
    capcana_frecventa:
      "Cea mai frecventa eroare este sa dai din reflex o definitie buna. Aici trebuie construita intentionat o definitie gresita, dar gresita exact prin regula aleasa la b.",
  }),
]
