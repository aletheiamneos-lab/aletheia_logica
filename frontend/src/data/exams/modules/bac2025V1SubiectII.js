import { card } from "./card"

const patratRules = [
  "Mai intai identifici forma initiala A, E, I sau O.",
  "Raporturile din patratul opozitiei se aplica intre propozitii cu aceiasi termeni S si P.",
  "Cantitatea si calitatea se modifica numai dupa relatia ceruta.",
]

const transformRules = [
  "Mai intai notezi forma initiala A, E, I sau O.",
  "Conversiunea inverseaza termenii, iar obversiunea schimba calitatea si complementeaza predicatul.",
  "Intr-un lant de operatii, fiecare pas se aplica pe rezultatul precedent.",
]

export const v1SubiectIIA = [
  card({
    reference: "II.A.1",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, contradictoria propozitiei 1: "Niciun membru al grupului formal nu este usor de impresionat."',
    titlu: "II.A.1 - Contradictoria propozitiei 1",
    raspuns_corect: 'SiP - "Unii membri ai grupului formal sunt usor de impresionat."',
    de_ce_este_corect:
      "Propozitia initiala este E: SeP. In patratul opozitiei, contradictoria lui E este I: SiP. Contradictoriile nu pot fi simultan adevarate si nu pot fi simultan false, de aceea perechea corecta a lui E este I.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Identific forma initiala E.",
      "Caut perechea contradictorie a formei E.",
      "Pastrez termenii si schimb doar forma in I.",
    ],
    schema_logica: {
      tip: "contradictie",
      continut: ["SeP", "contradictorie", "SiP"],
    },
    reprezentare_vizuala: ["E sus-dreapta", "I jos-stanga", "E <-> I"],
    step_by_step: [
      "Tradu propozitia initiala: SeP.",
      "Cerinta spune 'contradictorie'.",
      "In patrat, contradictoria lui E este I.",
      "Rezultatul formal este SiP.",
      "Formulez natural: 'Unii membri... sunt...' .",
    ],
    de_ce_nu: {
      a: "Nu alegi O; O este subalterna lui E, nu contradictoria ei.",
      b: "Nu alegi A; A este contrara lui E, nu contradictoria.",
      c: "Nu schimbi termenii S si P.",
      d: "Nu pastrezi negativitatea; contradictoria lui E este afirmativa.",
    },
    capcana_frecventa:
      "Confuzia obisnuita este intre contrara si contradictorie. Pentru E, contradictoria corecta este I.",
  }),
  card({
    reference: "II.A.2",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, contrara propozitiei 2: "Toate florile din ghivecele bunicii sunt colorate si parfumate."',
    titlu: "II.A.2 - Contrara propozitiei 2",
    raspuns_corect: 'SeP - "Nicio floare din ghivecele bunicii nu este colorata si parfumata."',
    de_ce_este_corect:
      "Propozitia initiala este A: SaP. In patratul opozitiei, contrara lui A este E: SeP. Raportul de contrarietate exista exclusiv intre universale, adica intre A si E.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Identific forma initiala A.",
      "Retin ca raportul de contrarietate leaga A de E.",
      "Pastrez S si P si trec la forma E.",
    ],
    schema_logica: {
      tip: "contrarietate",
      continut: ["SaP", "contrara", "SeP"],
    },
    reprezentare_vizuala: ["A sus-stanga", "E sus-dreapta", "A - E = contrarietate"],
    step_by_step: [
      "Tradu enuntul: SaP.",
      "Cerinta cere contrara.",
      "Contrara lui A este E.",
      "Scriu SeP.",
      "Tradu natural rezultatul.",
    ],
    de_ce_nu: {
      a: "Nu aleg O; O este contradictoria lui A.",
      b: "Nu aleg I; I este subalterna lui A.",
      c: "Nu schimb termenii, fiindca nu este conversiune.",
      d: "Nu cobor la particular, pentru ca relatia ceruta este intre universale.",
    },
    capcana_frecventa:
      "Elevii coboara gresit la particular. Contrara lui A ramane universala, nu particulara.",
  }),
  card({
    reference: "II.A.3",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, supraalterna propozitiei 3: "Unii scriitori romani contemporani sunt cunoscuti la nivel international."',
    titlu: "II.A.3 - Supraalterna propozitiei 3",
    raspuns_corect: 'SaP - "Toti scriitorii romani contemporani sunt cunoscuti la nivel international."',
    de_ce_este_corect:
      "Propozitia initiala este I: SiP. Supraalterna lui I este A: SaP. Relatia de supraalternare urca de la particular la universal, pastrand aceiasi termeni.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Tradu propozitia de plecare in forma I.",
      "Identific supraalterna acesteia.",
      "Pastrez termenii si urc in A.",
    ],
    schema_logica: {
      tip: "supraalternare",
      continut: ["SiP", "supraalterna", "SaP"],
    },
    reprezentare_vizuala: ["I jos-stanga", "A sus-stanga", "I -> A"],
    step_by_step: [
      "Recunosc SiP.",
      "Cerinta spune 'supraalterna'.",
      "In patrat, supraalterna lui I este A.",
      "Obtin SaP.",
      "Reformulez natural.",
    ],
    de_ce_nu: {
      a: "Nu aleg E; E nu este supraalterna lui I.",
      b: "Nu aleg O; O este subcontrara lui I, nu supraalterna.",
      c: "Nu schimb termenii S si P.",
      d: "Nu transform propozitia in negativa, pentru ca urcarea lui I duce la A.",
    },
    capcana_frecventa:
      "O greseala comuna este alegerea lui E fiindca este tot universala. Trebuie urmarita si calitatea, nu doar cantitatea.",
  }),
  card({
    reference: "II.A.4",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, subcontrara propozitiei 4: "Unele animale de la polul nord nu sunt in pericol de disparitie."',
    titlu: "II.A.4 - Subcontrara propozitiei 4",
    raspuns_corect: 'SiP - "Unele animale de la polul nord sunt in pericol de disparitie."',
    de_ce_este_corect:
      "Propozitia initiala este O: SoP. In patratul opozitiei, subcontrara lui O este I: SiP. Raportul de subcontrarietate exista intre particulare, una afirmativa si una negativa.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Identific forma initiala O.",
      "Retin ca subcontrara lui O este I.",
      "Pastrez S si P si schimb doar forma.",
    ],
    schema_logica: {
      tip: "subcontrarietate",
      continut: ["SoP", "subcontrara", "SiP"],
    },
    reprezentare_vizuala: ["O jos-dreapta", "I jos-stanga", "O - I"],
    step_by_step: [
      "Tradu enuntul: SoP.",
      "Cerinta cere subcontrara.",
      "Subcontrara lui O este I.",
      "Rezultatul este SiP.",
      "Tradu natural concluzia.",
    ],
    de_ce_nu: {
      a: "Nu aleg A; A este contradictoria lui O.",
      b: "Nu aleg E; E este supraalterna lui O.",
      c: "Nu schimb termenii intre ei.",
      d: "Nu pastrez negativitatea, fiindca subcontrara lui O este afirmativa.",
    },
    capcana_frecventa:
      "Confuzia frecventa este intre subcontrara si contradictorie. Pentru O, subcontrara corecta este I.",
  }),
]

export const v1SubiectIIB = [
  card({
    reference: "II.B.1",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva conversa corecta a propozitiei 2: "Toate florile din ghivecele bunicii sunt colorate si parfumate."',
    titlu: "II.B.1 - Conversa propozitiei 2",
    raspuns_corect: 'PiS - "Unele lucruri colorate si parfumate sunt flori din ghivecele bunicii."',
    de_ce_este_corect:
      "Propozitia initiala este A: SaP. Conversiunea corecta a unei propozitii A este prin accident, deci dupa inversarea termenilor cantitatea coboara la particular. Rezultatul corect este PiS, nu PaS.",
    tip_item: "Transformare - conversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SaP.",
      "Aplic regula conversiunii pentru A.",
      "Inversez termenii si cobor cantitatea la particular.",
    ],
    schema_logica: {
      tip: "conversiune prin accident",
      continut: ["SaP", "conversiune", "PiS"],
    },
    reprezentare_vizuala: ["Toti S sunt P", "=> Unele P sunt S"],
    step_by_step: [
      "Notez SaP.",
      "Inversez termenii.",
      "Verific regula speciala a formei A.",
      "Cobor la particular.",
      "Obtin PiS.",
    ],
    de_ce_nu: {
      a: "Nu scrii PaS; ar fi conversiune simpla nevalida a lui A.",
      b: "Nu complementezi predicatul, pentru ca nu se cere obversa.",
      c: "Nu schimbi calitatea; conversiunea pastreaza afirmativul aici.",
      d: "Nu omiti inversarea termenilor, fiindca tocmai aceasta defineste conversiunea.",
    },
    capcana_frecventa:
      "Forma A se converteste corect doar prin accident. PaS este eroarea clasica de examen.",
  }),
  card({
    reference: "II.B.2",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva obversa corecta a propozitiei 2: "Toate florile din ghivecele bunicii sunt colorate si parfumate."',
    titlu: "II.B.2 - Obversa propozitiei 2",
    raspuns_corect: 'Se~P - "Nicio floare din ghivecele bunicii nu este necolorata sau neparfumata."',
    de_ce_este_corect:
      "Obversiunea pastreaza cantitatea, schimba calitatea si complementeaza predicatul. Pornind de la SaP, obtinem Se~P.",
    tip_item: "Transformare - obversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SaP.",
      "Schimb calitatea din afirmativa in negativa.",
      "Complementarizez predicatul.",
    ],
    schema_logica: {
      tip: "obversiune",
      continut: ["SaP", "obversiune", "Se~P"],
    },
    reprezentare_vizuala: ["Toti S sunt P", "=> Niciun S nu este ~P"],
    step_by_step: [
      "Notez forma initiala SaP.",
      "Pastrand cantitatea, schimb calitatea.",
      "Inlocuiesc predicatul cu complementul sau.",
      "Obtin Se~P.",
    ],
    de_ce_nu: {
      a: "Nu inversezi termenii; aceasta ar fi conversiune.",
      b: "Nu cobori cantitatea; obversiunea pastreaza cantitatea.",
      c: "Nu complementezi subiectul.",
      d: "Nu uiti negatia, fiindca schimbarea calitatii este parte a operatiei.",
    },
    capcana_frecventa:
      "Multi elevi scriu SeP, dar fara complementul predicatului rezultatul nu este obversa corecta.",
  }),
  card({
    reference: "II.B.3",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva conversa corecta a propozitiei 3: "Unii scriitori romani contemporani sunt cunoscuti la nivel international."',
    titlu: "II.B.3 - Conversa propozitiei 3",
    raspuns_corect: 'PiS - "Unele persoane cunoscute la nivel international sunt scriitori romani contemporani."',
    de_ce_este_corect:
      "Propozitia initiala este I: SiP. Conversiunea ei este simpla, deci inverseaza termenii fara sa schimbe nici cantitatea, nici calitatea. Rezultatul este PiS.",
    tip_item: "Transformare - conversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SiP.",
      "Retin ca I se converteste simplu.",
      "Inversez termenii si pastrez particularul afirmativ.",
    ],
    schema_logica: {
      tip: "conversiune simpla",
      continut: ["SiP", "conversiune", "PiS"],
    },
    reprezentare_vizuala: ["Unele S sunt P", "=> Unele P sunt S"],
    step_by_step: [
      "Notez SiP.",
      "Schimb locul termenilor.",
      "Pastrand forma I, obtin PiS.",
    ],
    de_ce_nu: {
      a: "Nu cobori sau urci cantitatea; I se converteste simplu.",
      b: "Nu complementezi predicatul; aceasta ar fi obversiune.",
      c: "Nu schimbi calitatea propozitiei, pentru ca nu este ceruta.",
      d: "Nu lasi termenii in aceeasi ordine.",
    },
    capcana_frecventa:
      "Conversiunea formei I este una dintre cele mai sigure operatii. Greseala apare cand elevul complica inutil formula.",
  }),
  card({
    reference: "II.B.4",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva obversa corecta a propozitiei 3: "Unii scriitori romani contemporani sunt cunoscuti la nivel international."',
    titlu: "II.B.4 - Obversa propozitiei 3",
    raspuns_corect: 'So~P - "Unii scriitori romani contemporani nu sunt necunoscuti la nivel international."',
    de_ce_este_corect:
      "Forma initiala este I: SiP. Prin obversiune, I devine O, deoarece se schimba calitatea si se complementeaza predicatul. Rezultatul este So~P.",
    tip_item: "Transformare - obversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SiP.",
      "Schimb calitatea din afirmativa in negativa.",
      "Complementarizez predicatul.",
    ],
    schema_logica: {
      tip: "obversiune",
      continut: ["SiP", "obversiune", "So~P"],
    },
    reprezentare_vizuala: ["Unele S sunt P", "=> Unele S nu sunt ~P"],
    step_by_step: [
      "Pornesc de la SiP.",
      "Schimb calitatea in negativa.",
      "Introduc complementul predicatului.",
      "Obtin So~P.",
    ],
    de_ce_nu: {
      a: "Nu inversezi termenii; aceasta ar fi conversiune.",
      b: "Nu lasi forma I neschimbata; obversiunea ii modifica formula.",
      c: "Nu complementezi subiectul.",
      d: "Nu elimini negatia din rezultat.",
    },
    capcana_frecventa:
      "Greseala tipica este sa scrii PiS sau alta forma de conversiune. In obversiune, termenii raman pe loc.",
  }),
]

export const v1SubiectIIC = [
  card({
    reference: "II.C.1",
    marks: "3p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, supraalterna conversei obversei propozitiei 4: "Unele animale de la polul nord nu sunt in pericol de disparitie."',
    titlu: "II.C.1 - Supraalterna conversei obversei propozitiei 4",
    raspuns_corect: '~PaS - "Toate fiintele care nu sunt in pericol de disparitie sunt animale de la polul nord."',
    de_ce_este_corect:
      "Pornim de la SoP. Obversa lui O este Si~P. Conversa lui I este ~PiS. Supraalterna lui I este A, deci ~PaS. Fiecare operatie se aplica exact pe rezultatul precedent.",
    tip_item: "Transformare - lant de operatii",
    regula_generala: transformRules,
    cum_gandesti: [
      "Notez formula initiala.",
      "Aplic operatiile exact in ordinea data.",
      "Verific formula dupa fiecare pas intermediar.",
    ],
    schema_logica: {
      tip: "lant de transformari",
      continut: ["SoP", "Si~P", "~PiS", "~PaS"],
    },
    reprezentare_vizuala: [
      "SoP -> obversa -> Si~P",
      "Si~P -> conversa -> ~PiS",
      "~PiS -> supraalterna -> ~PaS",
    ],
    step_by_step: [
      "Pornesc de la SoP.",
      "Fac obversa: Si~P.",
      "Fac conversa: ~PiS.",
      "Ridic la supraalterna: ~PaS.",
    ],
    de_ce_nu: {
      a: "Nu schimb ordinea operatiilor; ea este fixata in enunt.",
      b: "Nu aplic fiecare operatie pe propozitia initiala.",
      c: "Nu uiti ca supraalterna lui I este A.",
      d: "Nu pierzi complementul predicatului introdus in primul pas.",
    },
    capcana_frecventa:
      "Eroarea tipica este sa sari direct la formula finala fara sa notezi etapele. Fara etape, lantul se rupe usor.",
  }),
  card({
    reference: "II.C.2",
    marks: "3p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, obversa conversei contrarei propozitiei 1: "Niciun membru al grupului formal nu este usor de impresionat."',
    titlu: "II.C.2 - Obversa conversei contrarei propozitiei 1",
    raspuns_corect: 'Po~S - "Unele fiinte usor de impresionat nu sunt non-membri ai grupului formal."',
    de_ce_este_corect:
      "Forma initiala este E: SeP. Contrara ei este A: SaP. Conversa lui A este prin accident: PiS. Obversa lui I este O cu predicat complementar: Po~S. Acesta este lantul corect al transformarilor cerute.",
    tip_item: "Transformare - lant de operatii",
    regula_generala: transformRules,
    cum_gandesti: [
      "Tradu mai intai propozitia initiala.",
      "Aplic operatiile una dupa alta, fara sa sar pasi.",
      "Controlez la fiecare etapa daca operatia este valida pentru forma curenta.",
    ],
    schema_logica: {
      tip: "lant de transformari",
      continut: ["SeP", "SaP", "PiS", "Po~S"],
    },
    reprezentare_vizuala: [
      "SeP -> contrara -> SaP",
      "SaP -> conversa -> PiS",
      "PiS -> obversa -> Po~S",
    ],
    step_by_step: [
      "Pornesc de la SeP.",
      "Construiesc contrara: SaP.",
      "Construiesc conversa corecta: PiS.",
      "Construiesc obversa: Po~S.",
    ],
    de_ce_nu: {
      a: "Nu alegi direct PaS, pentru ca forma A nu se converteste simplu.",
      b: "Nu omiti pasul de conversiune dintre contrara si obversa.",
      c: "Nu schimbi complementarea pe subiect; complementul apare la predicat.",
      d: "Nu inversezi ordinea operatiilor mentionate de cerinta.",
    },
    capcana_frecventa:
      "Cea mai frecventa eroare este transformarea lui SaP in PaS. Tocmai aici se pierde lantul corect.",
  }),
]

export const v1SubiectIID = [
  card({
    reference: "II.D.a",
    marks: "4p",
    officialText:
      "D. Doi elevi, X si Y, opineaza astfel:\n" +
      "X: Daca unele idei sunt adevarate, atunci unele idei nu sunt false.\n" +
      "Y: Toate zilele de vacanta sunt asteptate cu nerabdare de catre toti, deci unele zile asteptate cu nerabdare de catre toti sunt zile de vacanta.\n" +
      "a. scrieti, in limbaj formal, opiniile celor doi elevi;",
    titlu: "II.D.a - Limbajul formal al opiniilor",
    raspuns_corect: "X: SiP -> So~P; Y: SaP -> PiS",
    de_ce_este_corect:
      "La X, forma initiala este I: SiP, iar concluzia este obversa ei: So~P. La Y, forma initiala este A: SaP, iar concluzia este conversa ei corecta prin accident: PiS. Ambele formalizari reproduc exact trecerea exprimata in limbaj natural.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific pentru fiecare elev propozitia initiala si concluzia.",
      "Tradu formula de plecare si formula de sosire.",
      "Compar cele doua formule pentru a vedea operatia implicata.",
    ],
    schema_logica: {
      tip: "formalizare",
      continut: ["X: SiP -> So~P", "Y: SaP -> PiS"],
    },
    reprezentare_vizuala: ["X: I -> obversa", "Y: A -> conversa prin accident"],
    step_by_step: [
      "La X pornesc de la 'unele idei sunt adevarate' = SiP.",
      "Concluzia lui X este 'unele idei nu sunt false' = So~P.",
      "La Y pornesc de la SaP.",
      "Concluzia lui Y este PiS.",
    ],
    de_ce_nu: {
      a: "Nu formalizezi Y ca PaS; enuntul lui Y este particular in concluzie.",
      b: "Nu formalizezi X ca conversiune; termenii nu isi schimba locul.",
      c: "Nu omiti complementul predicatului in cazul lui X.",
      d: "Nu dai deja verdictul de validitate; la punctul a se cere doar formalizarea.",
    },
    capcana_frecventa:
      "Cand cele doua opinii apar in acelasi item, elevii tind sa le amestece. Formalizarea trebuie facuta separat pentru X si Y.",
  }),
  card({
    reference: "II.D.b",
    marks: "2p",
    officialText:
      "b. precizati corectitudinea/incorectitudinea logica a rationamentelor formalizate;",
    titlu: "II.D.b - Corectitudinea rationamentelor",
    raspuns_corect: "X: corect; Y: corect",
    de_ce_este_corect:
      "Rationamentul lui X este corect deoarece obversa lui SiP este So~P. Rationamentul lui Y este de asemenea corect, deoarece conversiunea lui SaP este valida prin accident si produce PiS. Ambele respecta regulile formei lor.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific operatia folosita de fiecare elev.",
      "Verific daca operatia este valida pentru forma data.",
      "Emit verdict separat pentru X si pentru Y.",
    ],
    schema_logica: {
      tip: "validitate",
      continut: ["X: SiP -> So~P valid", "Y: SaP -> PiS valid"],
    },
    reprezentare_vizuala: ["X respecta obversiunea lui I", "Y respecta conversiunea prin accident a lui A"],
    step_by_step: [
      "Verific X: I devine O cu predicat complementar.",
      "Rezultatul este corect.",
      "Verific Y: A devine I prin inversarea termenilor.",
      "Rezultatul este conversiune valida prin accident.",
    ],
    de_ce_nu: {
      a: "Nu declar Y incorect doar pentru ca forma A nu se converteste simplu; aici concluzia este PiS, nu PaS.",
      b: "Nu declar X incorect; obversiunea lui I este perfect valida.",
      c: "Nu inversa verdictul doar pe baza unei asimetrii verbale intre enunturi.",
      d: "Nu omite precizarea separata pentru fiecare rationament.",
    },
    capcana_frecventa:
      "Elevii memoreaza ca 'A nu se converteste' si marcheaza gresit Y drept incorect. Regula corecta este mai precisa: A nu se converteste simplu, dar se converteste prin accident.",
  }),
  card({
    reference: "II.D.c",
    marks: "2p",
    officialText:
      "c. explicati corectitudinea/incorectitudinea logica a rationamentului elevului Y.",
    titlu: "II.D.c - Explicatia pentru rationamentul elevului Y",
    raspuns_corect:
      "Rationamentul lui Y este corect, fiind o conversiune valida prin accident a unei propozitii A: SaP -> PiS.",
    de_ce_este_corect:
      "Propozitia initiala a lui Y este A: SaP. Conversiunea corecta a unei propozitii A nu pastreaza universalitatea, ci coboara la particular: PiS. Cum exact aceasta forma apare in concluzie, rationamentul este logic valid.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala A.",
      "Verific daca rezultatul propus este PiS sau PaS.",
      "Daca rezultatul este PiS, conversiunea este valida prin accident.",
    ],
    schema_logica: {
      tip: "conversiune prin accident",
      continut: ["SaP", "PiS", "valid"],
    },
    reprezentare_vizuala: ["Toti S sunt P", "=> Unele P sunt S"],
    step_by_step: [
      "Pornesc de la SaP.",
      "Observ ca Y inverseaza termenii.",
      "Concluzia este particulara, nu universala.",
      "Deci Y nu face o conversiune simpla, ci una prin accident.",
      "Rationamentul este corect.",
    ],
    de_ce_nu: {
      a: "Nu explic prin regula gresita 'A nu se converteste deloc'; ea se converteste prin accident.",
      b: "Nu spun doar 'este corect' fara forma logica SaP -> PiS.",
      c: "Nu confund rationamentul lui Y cu obversiunea.",
      d: "Nu uit ca tocmai particularizarea concluziei face inferenta valida.",
    },
    capcana_frecventa:
      "Cea mai comuna eroare este formularea prea vaga. Explicatia buna spune explicit ca Y foloseste conversiunea prin accident, nu conversiunea simpla.",
  }),
]
