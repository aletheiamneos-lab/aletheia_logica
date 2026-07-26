import { card } from "./card"

const syllogismRules = [
  "Intr-un silogism trebuie identificati termenii S, P si M.",
  "Figura fixeaza pozitia termenului mediu in premise.",
  "Validitatea se decide prin reguli formale sau prin diagrama Venn, nu prin plauzibilitatea enunturilor.",
]

const definitionRules = [
  "Definitia logica trebuie sa fie clara, nefigurata si adecvata.",
  "Definitul si definitorul trebuie sa fie convertibili sub raportul extensiunii.",
  "O definitie poate gresi prin metafora, prin prea larg sau prin prea ingust.",
]

export const v1SubiectIIIA = [
  card({
    reference: "III.A.a.1",
    marks: "2p",
    officialText:
      "a) Scrieti schemele de inferenta corespunzatoare modurilor silogistice date: eio-1.",
    titlu: "III.A.a.1 - Schema pentru eio-1",
    raspuns_corect: "MeP / SiM / SoP",
    de_ce_este_corect:
      "Figura I are forma M-P in premisa majora, S-M in premisa minora si S-P in concluzie. Aplicand literele E-I-O asupra acestor trei pozitii, rezulta MeP / SiM / SoP. Ordinea termenilor este impusa de figura, nu aleasa liber.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Identific mai intai figura dupa pozitia termenului mediu.",
      "Aplic literele modului pe majora, minora si concluzie.",
      "Scriu fractiile in ordinea standard: majora, minora, concluzie.",
    ],
    schema_logica: {
      tip: "mod silogistic",
      continut: ["figura I: M-P / S-M / S-P", "eio-1", "MeP / SiM / SoP"],
    },
    reprezentare_vizuala: ["Majora: M-P", "Minora: S-M", "Concluzie: S-P"],
    step_by_step: [
      "Fixez figura I.",
      "Pun E pe premisa majora: MeP.",
      "Pun I pe premisa minora: SiM.",
      "Pun O pe concluzie: SoP.",
    ],
    de_ce_nu: {
      a: "Nu folosesti figura a II-a sau a IV-a, fiindca aici termenul mediu trebuie sa fie subiect in majora si predicat in minora.",
      b: "Nu inversezi termenii in premisa majora; MeP nu este echivalent cu PeM.",
      c: "Nu schimbi tipul concluziei; modului eio ii corespunde exact o concluzie O.",
      d: "Nu sari direct la denumirea Ferio fara sa scrii fractiile cerute de item.",
    },
    capcana_frecventa:
      "Capcana tipica este memorarea literei modului fara figura. Fara figura corecta, schema devine gresita chiar daca literele E-I-O sunt retinute.",
  }),
  card({
    reference: "III.A.a.2",
    marks: "2p",
    officialText:
      "a) Scrieti schemele de inferenta corespunzatoare modurilor silogistice date: oao-2.",
    titlu: "III.A.a.2 - Schema pentru oao-2",
    raspuns_corect: "PoM / SaM / SoP",
    de_ce_este_corect:
      "Figura a II-a are forma P-M in premisa majora, S-M in premisa minora si S-P in concluzie. Aplicand literele O-A-O pe aceasta structura, obtinem PoM / SaM / SoP. Termenul mediu ramane predicat in ambele premise, conform figurii a II-a.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Fixez figura a II-a.",
      "Asez literele O, A si O pe cele trei propozitii.",
      "Verific daca termenul mediu apare ca predicat in ambele premise.",
    ],
    schema_logica: {
      tip: "mod silogistic",
      continut: ["figura II: P-M / S-M / S-P", "oao-2", "PoM / SaM / SoP"],
    },
    reprezentare_vizuala: ["Majora: P-M", "Minora: S-M", "Concluzie: S-P"],
    step_by_step: [
      "Recunosc figura II.",
      "Scriu majora O: PoM.",
      "Scriu minora A: SaM.",
      "Scriu concluzia O: SoP.",
    ],
    de_ce_nu: {
      a: "Nu transformi majora in MoP, fiindca asta ar schimba figura si distributia termenilor.",
      b: "Nu scrii minora ca MaS; acea pozitie apartine altei figuri.",
      c: "Nu schimbi concluzia in SiP sau SeP; modul cere exact SoP.",
      d: "Nu confunzi schema ceruta cu verdictul de validitate; aici se cere doar forma inferentei.",
    },
    capcana_frecventa:
      "Multi elevi retin literele modului, dar muta gresit termenul mediu. La figura a II-a, M trebuie sa fie predicat in ambele premise.",
  }),
  card({
    reference: "III.A.b",
    marks: "2p",
    officialText:
      "b) Construiti, in limbaj natural, un silogism care sa corespunda uneia dintre cele doua scheme de inferenta scrise la subpunctul a).",
    titlu: "III.A.b - Un silogism natural pentru unul dintre moduri",
    raspuns_corect:
      "Exemplu pentru eio-1: Niciun automobil electric nu este vehicul cu motor termic. Unele masini de oras sunt automobile electrice. Deci unele masini de oras nu sunt vehicule cu motor termic.",
    de_ce_este_corect:
      "Exemplul instaleaza termenii astfel: M = automobil electric, P = vehicul cu motor termic, S = masini de oras. Premisele au forma MeP si SiM, iar concluzia are forma SoP. Silogismul respecta deci exact schema Ferio din figura I.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Aleg o schema formala deja corecta.",
      "Fixez termeni concreti pentru S, P si M.",
      "Verific daca enunturile naturale pastreaza exact tipul E-I-O si figura.",
    ],
    schema_logica: {
      tip: "instantiere",
      continut: ["MeP", "SiM", "SoP"],
    },
    reprezentare_vizuala: [
      "M = automobile electrice",
      "P = vehicule cu motor termic",
      "S = masini de oras",
    ],
    step_by_step: [
      "Aleg schema eio-1.",
      "Asociez fiecarei litere un enunt natural corespunzator.",
      "Scriu majora E.",
      "Scriu minora I.",
      "Derivez concluzia O in aceeasi figura.",
    ],
    de_ce_nu: {
      a: "Nu este suficient ca propozitiile sa fie adevarate; ele trebuie sa respecte exact pozitia termenilor.",
      b: "Nu schimbi tipul premiselor fata de schema aleasa.",
      c: "Nu folosesti alt termen mediu in concluzie; concluzia trebuie sa lege doar S de P.",
      d: "Nu formulezi trei enunturi tematice fara structura silogistica reala.",
    },
    capcana_frecventa:
      "Eroarea frecventa este sa se construiasca trei propozitii plauzibile, dar care nu mai respecta figura sau distributia din schema aleasa.",
  }),
  card({
    reference: "III.A.c.1",
    marks: "4p",
    officialText:
      "c) Verificati explicit, prin metoda diagramelor Venn, validitatea modurilor silogistice date, precizand totodata decizia rezultata din reprezentarea grafica: eio-1.",
    titlu: "III.A.c.1 - Verificarea prin Venn a lui eio-1",
    raspuns_corect: "eio-1 este valid.",
    de_ce_este_corect:
      "Premisa MeP goleste integral intersectia M-P. Premisa SiM cere existenta unui element in regiunea comuna lui S si M. Cum zona S-M-P este deja anulata de premisa universala, semnul de existenta nu mai poate fi plasat decat in S-M-nonP. Aceasta pozitie forteaza concluzia SoP. Diagrama impune concluzia in mod necesar, deci modul este valid.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Umbresc mai intai zonele vide date de premisele universale.",
      "Plasez apoi semnul de existenta pentru premisa particulara.",
      "Verific daca diagrama obliga sau nu concluzia.",
    ],
    schema_logica: {
      tip: "verificare Venn",
      continut: ["MeP", "SiM", "SoP", "valid"],
    },
    reprezentare_vizuala: [
      "M intersect P = vida",
      "x in S intersect M",
      "x este fortat in S intersect nonP",
    ],
    step_by_step: [
      "Marchez ca vida intersectia M-P.",
      "Plasez x in regiunea S-M.",
      "Observ ca partea comuna cu P este interzisa.",
      "x ramane in S-nonP.",
      "Concluzia SoP rezulta necesar.",
    ],
    de_ce_nu: {
      a: "Nu afirm verdictul doar din memorie; validitatea trebuie sa rezulte din diagrama.",
      b: "Nu plasezi x inainte de umbrirea zonei vide, fiindca poti rata regiunea corecta.",
      c: "Nu confunzi o concluzie compatibila cu o concluzie fortata; aici concluzia este impusa.",
      d: "Nu uiti sa explici de ce x nu poate ramane in zona comuna cu P.",
    },
    capcana_frecventa:
      "Cea mai comuna eroare este desenarea corecta, dar fara justificarea pozitiei finale a lui x. Fara aceasta justificare, verdictul nu este complet argumentat.",
  }),
  card({
    reference: "III.A.c.2",
    marks: "4p",
    officialText:
      "c) Verificati explicit, prin metoda diagramelor Venn, validitatea modurilor silogistice date, precizand totodata decizia rezultata din reprezentarea grafica: oao-2.",
    titlu: "III.A.c.2 - Verificarea prin Venn a lui oao-2",
    raspuns_corect: "oao-2 este nevalid.",
    de_ce_este_corect:
      "Premisa PoM plaseaza un x in regiunea P-nonM. Premisa SaM goleste zona S-nonM, deoarece toti S sunt inclusi in M. Rezulta ca x din premisa particulara nu poate apartine lui S, ci ramane doar intr-o parte a lui P aflata in afara lui M. Prin urmare, diagrama nu obliga existenta unui element in S-nonP, adica nu forteaza concluzia SoP. Ceea ce nu este fortat grafic nu este valid silogistic.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Reprezint intai particulara O si universala A.",
      "Verific unde poate sta semnul de existenta dupa umbriri.",
      "Decid validitatea doar daca semnul de existenta ajunge necesar in zona concluziei.",
    ],
    schema_logica: {
      tip: "verificare Venn",
      continut: ["PoM", "SaM", "SoP", "nevalid"],
    },
    reprezentare_vizuala: [
      "x in P intersect nonM",
      "S subset M",
      "nu rezulta x in S intersect nonP",
    ],
    step_by_step: [
      "Plasez x in P-nonM pentru premisa O.",
      "Umbresc S-nonM pentru premisa A.",
      "Observ ca x nu poate trece in S.",
      "Concluzia SoP nu este impusa de diagrama.",
      "Verdictul este nevalid.",
    ],
    de_ce_nu: {
      a: "Nu confunzi existenta unui P in afara lui M cu existenta unui S in afara lui P; sunt regiuni diferite.",
      b: "Nu tratezi minora universala ca sursa de existenta; o propozitie A nu garanteaza obiecte existente.",
      c: "Nu spui ca modul este valid doar pentru ca are concluzie de tip O ca si una dintre premise.",
      d: "Nu folosesti drept criteriu faptul ca enunturile par plauzibile; validitatea cere necesitate formala.",
    },
    capcana_frecventa:
      "Elevii urmaresc doar literele O-A-O si presupun o concluzie negativa plauzibila. In diagrama, existenta din premisa majora ramane in afara lui S si nu sustine concluzia.",
  }),
]

export const v1SubiectIIIB = [
  card({
    reference: "III.B",
    marks: "6p",
    officialText:
      'B. Construiti, atat in limbaj formal cat si in limbaj natural, un silogism valid, prin care sa justificati propozitia "Unele vehicule nu sunt electrice".',
    titlu: "III.B - Silogism valid pentru concluzia data",
    raspuns_corect:
      "Formal: MeP / SiM / SoP.\nNatural: Niciun automobil cu motor termic nu este electric. Unele vehicule sunt automobile cu motor termic. Deci unele vehicule nu sunt electrice.",
    de_ce_este_corect:
      "Concluzia ceruta are forma O: SoP. Un mod valid care produce o asemenea concluzie este Ferio, adica EIO in figura I. Alegand M = automobil cu motor termic, S = vehicule si P = electrice, obtinem MeP / SiM / SoP, care respecta distributia termenilor si regulile silogismului valid.",
    tip_item: "Silogism",
    regula_generala: syllogismRules,
    cum_gandesti: [
      "Pastrez neschimbata concluzia data de item.",
      "Aleg un termen mediu care poate lega legitim S de P.",
      "Imbrac concluzia intr-un mod valid cunoscut, aici Ferio.",
    ],
    schema_logica: {
      tip: "Ferio",
      continut: ["MeP", "SiM", "SoP"],
    },
    reprezentare_vizuala: [
      "M subset nonP",
      "unele S sunt M",
      "=> unele S sunt nonP",
    ],
    step_by_step: [
      "Fixez concluzia: SoP.",
      "Aleg termenul mediu M.",
      "Construiesc o majora E: MeP.",
      "Construiesc o minora I: SiM.",
      "Derivez concluzia valida SoP.",
    ],
    de_ce_nu: {
      a: "Nu reformulezi concluzia in alt tip de propozitie; trebuie justificata exact propozitia data.",
      b: "Nu alegi un termen mediu care nu apare in ambele premise.",
      c: "Nu construesti premise adevarate dar formal invalide; adevarul material nu inlocuieste validitatea.",
      d: "Nu confunzi o simpla legatura tematica intre termeni cu o inferenta mediata corecta.",
    },
    capcana_frecventa:
      "Cea mai frecventa greseala este alegerea unor premise care sugereaza concluzia doar intuitiv. Cel mai sigur este sa pornesti de la un mod silogistic valid cunoscut.",
  }),
]

const v1CRich = [
  {
    reference: "III.C.1",
    statement: "1. Concluzia silogismului este o propozitie universala afirmativa.",
    answer: "F",
    justification:
      "Concluzia enuntata este 'Niciun dictionar de limba franceza nu este carte de desenat'. Formula ei este SeP, adica propozitie universala negativa de tip E. O propozitie universala afirmativa ar avea forma SaP, ceea ce nu este cazul aici.",
    schema: ["SeP", "E", "nu SaP"],
  },
  {
    reference: "III.C.2",
    statement: '2. Subiectul logic al concluziei este reprezentat de termenul "dictionar de limba franceza".',
    answer: "A",
    justification:
      "In concluzia 'Niciun dictionar de limba franceza nu este carte de desenat', termenul despre care se afirma negatia raportului cu predicatul este 'dictionar de limba franceza'. In forma SeP, acesta ocupa pozitia lui S, deci este subiectul logic al concluziei.",
    schema: ["SeP", "S = dictionar de limba franceza"],
  },
  {
    reference: "III.C.3",
    statement: "3. Termenul major este distribuit in premisa majora.",
    answer: "F",
    justification:
      "Termenul major este predicatul concluziei, adica 'carte de desenat', notat cu P. In premisa majora acesta apare in forma PoM, unde P este subiectul unei propozitii O. In propozitia O, subiectul nu este distribuit. Prin urmare, termenul major nu este distribuit in premisa majora.",
    schema: ["premisa majora: PoM", "O: subiect nedistribuit", "P nedistribuit"],
  },
  {
    reference: "III.C.4",
    statement: "4. Termenul mediu este distribuit in ambele premise.",
    answer: "F",
    justification:
      "Termenul mediu este 'pentru uzul elevilor de liceu', notat cu M. In premisa majora PoM, M apare ca predicat al unei propozitii O si este distribuit. In premisa minora SiM, M apare intr-o propozitie I, unde niciun termen nu este distribuit. Deci M nu este distribuit in ambele premise, ci doar in una.",
    schema: ["premisa majora: PoM -> M distribuit", "premisa minora: SiM -> M nedistribuit"],
  },
]

export const v1SubiectIIIC = v1CRich.map((entry) =>
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
      "Identific forma concluziei sau a premisei invocate in enunt.",
      "Stabilesc distributia termenului vizat dupa regula pentru A, E, I sau O.",
      "Abia apoi decid A sau F.",
    ],
    schema_logica: {
      tip: "verificare distributie",
      continut: entry.schema,
    },
    reprezentare_vizuala: entry.schema,
    step_by_step: [
      "Citesc exact enuntul de verificat.",
      "Transcriu forma categorica relevanta.",
      "Aplic regula de distributie sau de identificare a termenilor.",
      "Compar rezultatul cu afirmatia data.",
      "Notez verdictul A/F.",
    ],
    de_ce_nu: {
      a: "Nu raspund dupa sensul obisnuit al propozitiei; aici conteaza strict forma logica.",
      b: "Nu confund termenul major cu subiectul concluziei sau cu termenul mediu.",
      c: "Nu uit ca distributia se stabileste din tipul A, E, I sau O, nu din continutul lexical.",
      d: "Nu notez A/F fara sa verific pozitia termenului in propozitia relevanta.",
    },
    capcana_frecventa:
      "Capcana standard este evaluarea intuitiva a enuntului, fara formalizare. La aceste itemi, un singur detaliu de distributie schimba verdictul.",
  }),
)

export const v1SubiectIIID = [
  card({
    reference: "III.D.a",
    marks: "2p",
    officialText:
      'D. Se da urmatoarea definitie: "Ciocanitoarea este medicul padurii."\n' +
      "a) Mentionati o regula de corectitudine pe care o incalca definitia data.",
    titlu: "III.D.a - Regula incalcata de definitia data",
    raspuns_corect:
      "Un raspuns acceptat: definitia incalca regula claritatii si preciziei, pentru ca este metaforica.",
    de_ce_este_corect:
      "Definitia logica trebuie sa fie proprie, clara si nefigurata. Expresia 'medicul padurii' are valoare metaforica si evocatoare, dar nu fixeaza riguros notele definitorii ale termenului 'ciocanitoare'. Ea nu determina precis nici intensiunea, nici extensiunea termenului. De aceea este incalcata regula claritatii si preciziei.",
    tip_item: "Definitie logica",
    regula_generala: definitionRules,
    cum_gandesti: [
      "Verific daca definitorul este propriu sau figurat.",
      "Identific regula de definire afectata de eroarea observata.",
      "Formulez explicit regula, nu doar critica generala.",
    ],
    schema_logica: {
      tip: "eroare de definire",
      continut: ["definitie metaforica", "claritate incalcata"],
    },
    reprezentare_vizuala: ["Definit = ciocanitoare", "Definitor metaforic = medicul padurii"],
    step_by_step: [
      "Citesc definitia data.",
      "Observ ca definitorul este figurat.",
      "Verific daca formula este potrivita pentru o definitie logica.",
      "Conchid ca regula claritatii este incalcata.",
    ],
    de_ce_nu: {
      a: "Nu evaluez frumusetea literara a formularii, ci corectitudinea ei logica.",
      b: "Nu spun doar ca definitia este vaga; trebuie indicata regula precisa incalcata.",
      c: "Nu confund metafora cu o simpla definitie prea larga daca nu arati si raportul de extensiune.",
      d: "Nu reformulez definitia in loc sa raspund la cerinta despre regula incalcata.",
    },
    capcana_frecventa:
      "Elevii sunt tentati sa accepte expresia pentru ca este cunoscuta si sugestiva. In logica, sugestivul nu inlocuieste precizia definitorie.",
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
      "Itemul cere o alta regula a definirii, diferita de cea invocata la punctul a. Regula adecvarii este corecta deoarece definitorul trebuie sa aiba aceeasi extensiune cu termenul definit. Daca acopera mai mult sau mai putin, definitia devine incorecta.",
    tip_item: "Definitie logica",
    regula_generala: definitionRules,
    cum_gandesti: [
      "Exclud regula deja folosita la punctul a.",
      "Aleg o alta regula standard a definirii.",
      "O exprim complet, cu sensul ei logic.",
    ],
    schema_logica: {
      tip: "regula de definire",
      continut: ["Ext(definit) = Ext(definitor)"],
    },
    reprezentare_vizuala: ["nici prea larga", "nici prea ingusta", "extensiuni egale"],
    step_by_step: [
      "Retin ce regula am mentionat la punctul a.",
      "Selectez o regula diferita.",
      "Formulez regula adecvarii prin raportul de extensiune.",
    ],
    de_ce_nu: {
      a: "Nu repet aceeasi regula de la punctul anterior sub o alta formulare vaga.",
      b: "Nu aleg o pseudo-regula de tip 'sa fie buna' sau 'sa fie completa'.",
      c: "Nu confund regulile definirii cu regulile clasificarii sau demonstratiei.",
      d: "Nu dau doar numele regulii daca nu se intelege si continutul ei logic.",
    },
    capcana_frecventa:
      "Raspunsurile foarte generale par acceptabile la prima vedere, dar pierd rigoarea ceruta. Regula trebuie numita si inteleasa logic.",
  }),
  card({
    reference: "III.D.c",
    marks: "2p",
    officialText:
      'c) Construiti o definitie, avand ca definit termenul "ciocanitoare", care sa incalce regula precizata la subpunctul b).',
    titlu: "III.D.c - Definitie care incalca regula aleasa la b",
    raspuns_corect:
      'Exemplu acceptat daca la b ai ales adecvarea: "Ciocanitoarea este orice pasare."',
    de_ce_este_corect:
      "Daca la punctul b a fost aleasa regula adecvarii, atunci definitia de aici trebuie sa fie voit prea larga sau prea ingusta. Formula 'Ciocanitoarea este orice pasare' este prea larga: extensiunea definitorului depaseste extensiunea termenului definit, deoarece include multe pasari care nu sunt ciocanitori. Prin urmare, ea incalca exact regula ceruta.",
    tip_item: "Definitie logica",
    regula_generala: definitionRules,
    cum_gandesti: [
      "Pornesc de la regula selectata la punctul b.",
      "Construiesc intentionat o definitie care o incalca.",
      "Verific daca eroarea este exact cea dorita, nu una accidentala.",
    ],
    schema_logica: {
      tip: "definitie inadecvata",
      continut: ["Ext(definitor) superset Ext(definit)"],
    },
    reprezentare_vizuala: [
      "ciocanitoare subset pasare",
      "nu orice pasare este ciocanitoare",
    ],
    step_by_step: [
      "Retin regula de la punctul b.",
      "Aleg sa o incalc prin definitie prea larga.",
      "Construiesc definitorul 'orice pasare'.",
      "Compar extensiunile.",
      "Conchid ca definitia este incorecta prin inadecvare.",
    ],
    de_ce_nu: {
      a: "Nu ofer o definitie corecta, pentru ca cerinta cere explicit o definitie gresita controlat.",
      b: "Nu incalc alta regula decat cea precizata la punctul b.",
      c: "Nu aleg un definitor fara legatura cu termenul 'ciocanitoare', fiindca eroarea trebuie sa fie logica, nu absurda.",
      d: "Nu las eroarea ascunsa; ea trebuie sa poata fi recunoscuta imediat ca prea larga sau prea ingusta.",
    },
    capcana_frecventa:
      "Eroarea cea mai comuna este raspunsul corect logic la un item care cere explicit o definitie incorecta. Aici greseala trebuie construita controlat.",
  }),
]
