import { card } from "./card"

const patratRules = [
  "Mai intai identifici forma initiala A, E, I sau O.",
  "Raporturile din patratul opozitiei se aplica intre propozitii cu aceiasi termeni S si P.",
  "Cantitatea si calitatea se modifica numai dupa relatia ceruta: contradictorie, contrara, subalterna sau subcontrara.",
]

const transformRules = [
  "Mai intai notezi forma initiala A, E, I sau O.",
  "Conversiunea inverseaza termenii, iar obversiunea schimba calitatea si complementeaza predicatul.",
  "Operatiile succesive se aplica pe rezultatul pasului anterior, nu pe propozitia initiala.",
]

export const v6SubiectIIA = [
  card({
    reference: "II.A.1",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, subalterna propozitiei 1: "Toate mamiferele acvatice sunt vivipare."',
    titlu: "II.A.1 - Subalterna propozitiei 1",
    raspuns_corect: 'SiP - "Unele mamifere acvatice sunt vivipare."',
    de_ce_este_corect:
      "Propozitia de plecare este de tip A: SaP. In patratul opozitiei, subalterna unei propozitii A este propozitia I cu aceiasi termeni, deci SiP. Se pastreaza atat subiectul, cat si predicatul; se modifica doar cantitatea, de la universala la particulara.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Tradu propozitia initiala in forma SaP, SeP, SiP sau SoP.",
      "Identifica relatia ceruta in patratul opozitiei.",
      "Pastreaza termenii si modifica doar forma corespunzatoare relatiei.",
    ],
    schema_logica: {
      tip: "subalternare",
      continut: ["SaP", "subalterna", "SiP"],
    },
    reprezentare_vizuala: ["A sus", "I jos", "A -> I"],
    step_by_step: [
      "Recunosc forma initiala: 'Toate S sunt P' = SaP.",
      "Cerinta cere subalterna lui A.",
      "In patratul opozitiei, A coboara la I.",
      "Rezultatul formal este SiP.",
      "Tradu in limbaj natural fara sa schimb termenii.",
    ],
    de_ce_nu: {
      a: "Nu schimbi termenii S si P; patratul opozitiei lucreaza pe aceeasi materie logica.",
      b: "Nu alegi O, pentru ca aceasta este contradictoria lui A, nu subalterna ei.",
      c: "Nu pastrezi universalitatea; subalterna inseamna trecerea de la universal la particular.",
      d: "Nu introduci negatie, fiindca relatia ceruta nu schimba calitatea aici.",
    },
    capcana_frecventa:
      "Elevii confunda adesea subalterna cu contradictoria si scriu SoP. Pentru A, subalterna corecta este I, nu O.",
  }),
  card({
    reference: "II.A.2",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, contradictoria propozitiei 2: "Unele persoane pasionate de poezie sunt interesate de filosofie."',
    titlu: "II.A.2 - Contradictoria propozitiei 2",
    raspuns_corect: 'SeP - "Nicio persoana pasionata de poezie nu este interesata de filosofie."',
    de_ce_este_corect:
      "Propozitia initiala este I: SiP. In patratul opozitiei, contradictoria lui I este E: SeP. Contradictoriile nu pot fi simultan adevarate si nu pot fi simultan false; de aceea trecerea corecta este exact de la I la E.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Identific forma initiala SiP.",
      "Caut perechea contradictorie a formei I.",
      "Pastrez aceiasi termeni si schimb doar cantitatea si calitatea cerute.",
    ],
    schema_logica: {
      tip: "contradictie",
      continut: ["SiP", "contradictorie", "SeP"],
    },
    reprezentare_vizuala: ["I jos-stanga", "E sus-dreapta", "I <-> E"],
    step_by_step: [
      "Tradu enuntul: 'Unele S sunt P' = SiP.",
      "Cerinta cere contradictoria lui I.",
      "In patrat, contradictoria lui I este E.",
      "Obtin SeP.",
      "Reformulez natural: 'Nicio persoana...' .",
    ],
    de_ce_nu: {
      a: "Nu aleg O; I si O sunt subcontrare, nu contradictorii.",
      b: "Nu aleg A; A este supraalterna lui I, nu contradictoria ei.",
      c: "Nu schimb termenii, pentru ca raportul este intre propozitii cu aceiasi S si P.",
      d: "Nu pastrez caracterul afirmativ; contradictoria lui I este negativa.",
    },
    capcana_frecventa:
      "Multi elevi confunda subcontrara cu contradictoria. Pentru I, contradictoria este E, nu O.",
  }),
  card({
    reference: "II.A.3",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, contrara propozitiei 3: "Niciun element chimic din grupa a VI-a nu este halogen."',
    titlu: "II.A.3 - Contrara propozitiei 3",
    raspuns_corect: 'SaP - "Toate elementele chimice din grupa a VI-a sunt halogeni."',
    de_ce_este_corect:
      "Propozitia initiala este E: SeP. In patratul opozitiei, contrara lui E este A: SaP. Raportul de contrarietate exista numai intre universale, deci trecerea corecta este de la universala negativa la universala afirmativa cu aceiasi termeni.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Identific forma initiala SeP.",
      "Retin ca raportul de contrarietate exista doar intre A si E.",
      "Trec din E in A, pastrand S si P.",
    ],
    schema_logica: {
      tip: "contrarietate",
      continut: ["SeP", "contrara", "SaP"],
    },
    reprezentare_vizuala: ["E sus-dreapta", "A sus-stanga", "E - A = contrarietate"],
    step_by_step: [
      "Recunosc tiparul 'Niciun S nu este P' = SeP.",
      "Cerinta spune 'contrara'.",
      "Contrarele sunt A si E.",
      "Din E obtin A.",
      "Rezultatul este SaP.",
    ],
    de_ce_nu: {
      a: "Nu aleg I, fiindca I nu este in raport de contrarietate cu E.",
      b: "Nu aleg O, deoarece O este subalterna lui E, nu contrara ei.",
      c: "Nu schimb termenii intre ei; raportul cerut este in patrat, nu o conversiune.",
      d: "Nu transform propozitia in particulara; contrarietatea ramane intre universale.",
    },
    capcana_frecventa:
      "Elevii aleg adesea I pentru ca suna mai apropiat de enuntul initial. Dar contrarietatea functioneaza numai pe axa universala A-E.",
  }),
  card({
    reference: "II.A.4",
    marks: "2p",
    officialText:
      'Construiti, atat in limbaj formal cat si in limbaj natural, subcontrara propozitiei 4: "Unele activitati scolare nu sunt obligatorii."',
    titlu: "II.A.4 - Subcontrara propozitiei 4",
    raspuns_corect: 'SiP - "Unele activitati scolare sunt obligatorii."',
    de_ce_este_corect:
      "Propozitia initiala este O: SoP. In patratul opozitiei, subcontrara lui O este I: SiP. Raportul de subcontrarietate leaga cele doua particulare, una afirmativa si una negativa, cu aceiasi termeni.",
    tip_item: "Patrat logic",
    regula_generala: patratRules,
    cum_gandesti: [
      "Traduc enuntul in SoP.",
      "Retin ca subcontrarietatea exista intre I si O.",
      "Trec din O in I, pastrand termenii.",
    ],
    schema_logica: {
      tip: "subcontrarietate",
      continut: ["SoP", "subcontrara", "SiP"],
    },
    reprezentare_vizuala: ["O jos-dreapta", "I jos-stanga", "O - I = subcontrarietate"],
    step_by_step: [
      "Recunosc forma 'Unele S nu sunt P' = SoP.",
      "Cerinta cere subcontrara.",
      "In patrat, O este subcontrara cu I.",
      "Rezultatul formal este SiP.",
      "Tradu natural fara sa schimbi termenii.",
    ],
    de_ce_nu: {
      a: "Nu aleg A; aceasta este contradictoria lui O, nu subcontrara.",
      b: "Nu aleg E; E este supraalterna lui O, nu subcontrara.",
      c: "Nu schimb termenii intre ei.",
      d: "Nu pastrez negativitatea, fiindca subcontrara lui O este afirmativa.",
    },
    capcana_frecventa:
      "Confuzia frecventa este intre subcontrara si contradictorie. Pentru O, subcontrara este I, in timp ce contradictoria este A.",
  }),
]

export const v6SubiectIIB = [
  card({
    reference: "II.B.1",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva conversa corecta a propozitiei 1: "Toate mamiferele acvatice sunt vivipare."',
    titlu: "II.B.1 - Conversa propozitiei 1",
    raspuns_corect: 'PiS - "Unele fiinte vivipare sunt mamifere acvatice."',
    de_ce_este_corect:
      "Propozitia initiala este A: SaP. Conversiunea unei propozitii A nu este simpla, ci prin accident. Dupa inversarea termenilor, cantitatea trebuie coborata de la universal la particular. De aceea rezultatul corect este PiS, nu PaS.",
    tip_item: "Transformare - conversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SaP.",
      "Aplic regula conversiunii pentru forma A.",
      "Inversez termenii si cobor cantitatea la particular.",
    ],
    schema_logica: {
      tip: "conversiune prin accident",
      continut: ["SaP", "conversiune", "PiS"],
    },
    reprezentare_vizuala: ["Toti S sunt P", "=> Unii P sunt S"],
    step_by_step: [
      "Notez forma initiala: SaP.",
      "Aplic conversiunea: schimb S cu P.",
      "Verific regula speciala pentru A: nu raman la universal.",
      "Cobor la particular.",
      "Obtin PiS.",
    ],
    de_ce_nu: {
      a: "Nu scrii PaS, fiindca ar fi conversiune simpla nevalida a propozitiei A.",
      b: "Nu faci obversiune; cerinta este explicit despre conversa.",
      c: "Nu schimbi predicatul in complement; asta ar apartine obversiunii.",
      d: "Nu uita sa inversezi termenii; doar schimbarea cantitatii nu este suficienta.",
    },
    capcana_frecventa:
      "Cea mai comuna eroare este PaS. Pentru A, conversa corecta este doar particulara: PiS.",
  }),
  card({
    reference: "II.B.2",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva obversa corecta a propozitiei 1: "Toate mamiferele acvatice sunt vivipare."',
    titlu: "II.B.2 - Obversa propozitiei 1",
    raspuns_corect: 'Se~P - "Niciun mamifer acvatic nu este nevivipar."',
    de_ce_este_corect:
      "Obversiunea pastreaza cantitatea, schimba calitatea si complementeaza predicatul. Pornind de la A: SaP, rezultatul este E: Se~P. Subiectul ramane neschimbat, iar predicatul 'vivipare' este inlocuit cu complementarul sau logic.",
    tip_item: "Transformare - obversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SaP.",
      "Pastrand cantitatea, schimb calitatea din afirmativa in negativa.",
      "Complementarizez predicatul P in ~P.",
    ],
    schema_logica: {
      tip: "obversiune",
      continut: ["SaP", "obversiune", "Se~P"],
    },
    reprezentare_vizuala: ["Toti S sunt P", "=> Niciun S nu este ~P"],
    step_by_step: [
      "Notez formula initiala: SaP.",
      "Schimb calitatea: A devine E.",
      "Pastrand subiectul, complementez predicatul.",
      "Obtin Se~P.",
      "Tradu natural rezultatul.",
    ],
    de_ce_nu: {
      a: "Nu inversezi termenii; aceasta ar fi conversiune, nu obversiune.",
      b: "Nu modifici subiectul, ci numai calitatea si predicatul.",
      c: "Nu cobori cantitatea; obversiunea pastreaza cantitatea propozitiei.",
      d: "Nu uita complementul predicatului; altfel nu mai este obversa corecta.",
    },
    capcana_frecventa:
      "Unii elevi scriu doar SeP. Fara complementarea predicatului, operatia nu este obversiune, ci doar schimbare incorecta de calitate.",
  }),
  card({
    reference: "II.B.3",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva conversa corecta a propozitiei 2: "Unele persoane pasionate de poezie sunt interesate de filosofie."',
    titlu: "II.B.3 - Conversa propozitiei 2",
    raspuns_corect: 'PiS - "Unele persoane interesate de filosofie sunt pasionate de poezie."',
    de_ce_este_corect:
      "Propozitia initiala este I: SiP. Forma I admite conversiune simpla. Aceasta inseamna inversarea termenilor S si P fara schimbarea cantitatii sau a calitatii. De aceea rezultatul corect este PiS.",
    tip_item: "Transformare - conversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SiP.",
      "Verific regula specifica formei I: conversiune simpla.",
      "Inversez termenii fara sa schimb cantitatea sau calitatea.",
    ],
    schema_logica: {
      tip: "conversiune simpla",
      continut: ["SiP", "conversiune", "PiS"],
    },
    reprezentare_vizuala: ["Unele S sunt P", "=> Unele P sunt S"],
    step_by_step: [
      "Notez formula initiala: SiP.",
      "Aplic conversiunea simpla proprie formei I.",
      "Inversez locul termenilor.",
      "Pastrand particularul afirmativ, obtin PiS.",
    ],
    de_ce_nu: {
      a: "Nu cobori sau nu urci cantitatea; forma I se converteste simplu.",
      b: "Nu complementezi predicatul; asta ar fi obversiune.",
      c: "Nu schimbi calitatea, fiindca la conversiune simpla ea ramane afirmativa.",
      d: "Nu ramai la SiP cu termenii in aceeasi ordine; conversiunea cere inversarea lor.",
    },
    capcana_frecventa:
      "Unii elevi complica inutil forma I. Ea este cea mai simpla: unele S sunt P -> unele P sunt S.",
  }),
  card({
    reference: "II.B.4",
    marks: "2p",
    officialText:
      'Aplicati explicit operatiile de conversiune si obversiune, pentru a deriva obversa corecta a propozitiei 2: "Unele persoane pasionate de poezie sunt interesate de filosofie."',
    titlu: "II.B.4 - Obversa propozitiei 2",
    raspuns_corect: 'So~P - "Unele persoane pasionate de poezie nu sunt neinteresate de filosofie."',
    de_ce_este_corect:
      "Propozitia initiala este I: SiP. Prin obversiune, forma I devine O: se schimba calitatea din afirmativa in negativa si se complementeaza predicatul. Rezultatul este So~P.",
    tip_item: "Transformare - obversiune",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala SiP.",
      "Schimb calitatea din afirmativa in negativa.",
      "Complementarizez predicatul P in ~P.",
    ],
    schema_logica: {
      tip: "obversiune",
      continut: ["SiP", "obversiune", "So~P"],
    },
    reprezentare_vizuala: ["Unele S sunt P", "=> Unele S nu sunt ~P"],
    step_by_step: [
      "Pornesc de la SiP.",
      "Schimb calitatea in negativa.",
      "Pastrand subiectul, complementez predicatul.",
      "Obtin So~P.",
      "Tradu rezultatul in limbaj natural.",
    ],
    de_ce_nu: {
      a: "Nu inversezi termenii; ar fi conversiune, nu obversiune.",
      b: "Nu pastrezi forma I; obversiunea ei duce la O.",
      c: "Nu complementezi subiectul, ci predicatul.",
      d: "Nu omite negatia din concluzie; schimbarea de calitate este obligatorie.",
    },
    capcana_frecventa:
      "Eroarea tipica este PiS sau o alta forma de conversiune. In obversiune, termenii raman pe loc.",
  }),
]

export const v6SubiectIIC = [
  card({
    reference: "II.C.1",
    marks: "3p",
    officialText:
      'Construiti, atat in limbaj formal, cat si in limbaj natural, conversa obversei supraalternei propozitiei 4: "Unele activitati scolare nu sunt obligatorii."',
    titlu: "II.C.1 - Conversa obversei supraalternei propozitiei 4",
    raspuns_corect: '~PiS - "Unele activitati neobligatorii sunt activitati scolare."',
    de_ce_este_corect:
      "Propozitia initiala este O: SoP. Supraalterna ei este E: SeP. Obversa lui E este A: Sa~P. Conversa corecta a unei propozitii A este prin accident: ~PiS. Fiecare operatie se aplica pe rezultatul pasului anterior, nu direct pe forma initiala.",
    tip_item: "Transformare - lant de operatii",
    regula_generala: transformRules,
    cum_gandesti: [
      "Notez formula initiala.",
      "Execut operatiile in exact ordinea ceruta.",
      "La fiecare pas lucrez pe rezultatul precedent.",
    ],
    schema_logica: {
      tip: "lant de transformari",
      continut: ["SoP", "SeP", "Sa~P", "~PiS"],
    },
    reprezentare_vizuala: [
      "SoP -> supraalterna -> SeP",
      "SeP -> obversa -> Sa~P",
      "Sa~P -> conversa -> ~PiS",
    ],
    step_by_step: [
      "Pornesc de la SoP.",
      "Ridic la supraalterna: SeP.",
      "Aplic obversiunea: Sa~P.",
      "Aplic conversiunea prin accident: ~PiS.",
      "Scriu rezultatul si in limbaj natural.",
    ],
    de_ce_nu: {
      a: "Nu sari direct de la SoP la conversiune; O nu admite conversiune valida simpla.",
      b: "Nu schimbi ordinea operatiilor; ea este fixata de enunt.",
      c: "Nu aplici fiecare operatie pe propozitia initiala, ci pe rezultatul pasului anterior.",
      d: "Nu uiti ca la final conversiunea lui A este prin accident, nu simpla.",
    },
    capcana_frecventa:
      "Cea mai frecventa eroare este aplicarea operatiei finale pe formula initiala sau confundarea ordinii pasilor.",
  }),
  card({
    reference: "II.C.2",
    marks: "3p",
    officialText:
      'Construiti, atat in limbaj formal, cat si in limbaj natural, obversa supraalternei propozitiei 2: "Unele persoane pasionate de poezie sunt interesate de filosofie."',
    titlu: "II.C.2 - Obversa supraalternei propozitiei 2",
    raspuns_corect: 'Se~P - "Nicio persoana pasionata de poezie nu este neinteresata de filosofie."',
    de_ce_este_corect:
      "Forma initiala este I: SiP. Supraalterna lui I este A: SaP. Obversa unei propozitii A este E cu predicat complementar: Se~P. Rezultatul corect al lantului este deci Se~P.",
    tip_item: "Transformare - lant de operatii",
    regula_generala: transformRules,
    cum_gandesti: [
      "Fixez formula initiala SiP.",
      "Aplic mai intai relatia din patrat, apoi transformarea imediata.",
      "Verific forma finala dupa fiecare pas.",
    ],
    schema_logica: {
      tip: "lant de transformari",
      continut: ["SiP", "SaP", "Se~P"],
    },
    reprezentare_vizuala: [
      "SiP -> supraalterna -> SaP",
      "SaP -> obversa -> Se~P",
    ],
    step_by_step: [
      "Pornesc de la SiP.",
      "Ridic la supraalterna: SaP.",
      "Aplic obversiunea: Se~P.",
      "Formulez natural rezultatul obtinut.",
    ],
    de_ce_nu: {
      a: "Nu faci obversiunea direct pe I fara sa respecti mai intai cerinta de supraalterna.",
      b: "Nu inversezi termenii, fiindca enuntul nu cere conversa.",
      c: "Nu omiti complementarea predicatului in obversa finala.",
      d: "Nu schimbi termenii S si P in niciun pas al patratului opozitiei.",
    },
    capcana_frecventa:
      "Elevii aplica direct obversiunea lui I si obtin So~P, uitand ca itemul cere mai intai supraalterna.",
  }),
]

export const v6SubiectIID = [
  card({
    reference: "II.D.a",
    marks: "4p",
    officialText:
      "D. Doi elevi, X si Y, opineaza astfel:\n" +
      "X: De vreme ce perfectiunea este un ideal, conchidem ca perfectiunea nu este un non-ideal.\n" +
      "Y: Toti oamenii pasionati de munca lor sunt pianisti, decurge din faptul ca toti pianistii sunt oameni pasionati de munca lor.\n" +
      "a. scrieti, in limbaj formal, opiniile celor doi elevi;",
    titlu: "II.D.a - Limbajul formal al opiniilor",
    raspuns_corect: "X: SaP -> Se~P; Y: SaP -> PaS",
    de_ce_este_corect:
      "In enuntul lui X, 'perfectiunea este un ideal' are forma A: SaP, iar 'perfectiunea nu este un non-ideal' este obversa ei: Se~P. In enuntul lui Y, de la 'Toti pianistii sunt oameni pasionati de munca lor' se incearca trecerea la PaS, adica o conversiune simpla a unei propozitii A.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific pentru fiecare enunt propozitia de plecare si concluzia.",
      "Tradu separat forma initiala si forma finala.",
      "Compar cele doua formule pentru a vedea ce operatie se incearca.",
    ],
    schema_logica: {
      tip: "formalizare",
      continut: ["X: SaP -> Se~P", "Y: SaP -> PaS"],
    },
    reprezentare_vizuala: [
      "X: A -> obversa",
      "Y: A -> conversiune simpla incercata",
    ],
    step_by_step: [
      "La X notez forma initiala SaP.",
      "Rezultatul mentionat de X este Se~P.",
      "La Y notez forma initiala SaP.",
      "Rezultatul mentionat de Y este PaS.",
    ],
    de_ce_nu: {
      a: "Nu formalizezi Y ca PiS; enuntul lui Y afirma universalul, nu particularul.",
      b: "Nu formalizezi X ca SeP, fiindca predicatul devine complementar.",
      c: "Nu schimbi rolul termenilor fara sa verifici daca enuntul chiar face asta.",
      d: "Nu confunda formalizarea operatiei cu verdictul asupra validitatii ei.",
    },
    capcana_frecventa:
      "La punctul a nu se cere inca verdictul, ci doar traducerea exacta in limbaj formal a celor doua opinii.",
  }),
  card({
    reference: "II.D.b",
    marks: "2p",
    officialText:
      "b. precizati corectitudinea/incorectitudinea logica a rationamentelor formalizate;",
    titlu: "II.D.b - Corectitudinea rationamentelor",
    raspuns_corect: "X: corect; Y: incorect",
    de_ce_este_corect:
      "Rationamentul lui X este corect deoarece SaP se transforma valid prin obversiune in Se~P. Rationamentul lui Y este incorect deoarece din SaP nu rezulta valid PaS; aceasta ar fi o conversiune simpla nepermisa pentru forma A.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific operatia incercata de fiecare elev.",
      "Verific regula de validitate a acelei operatii pentru forma data.",
      "Emit verdict separat pentru fiecare rationament.",
    ],
    schema_logica: {
      tip: "validitate",
      continut: ["X: SaP -> Se~P valid", "Y: SaP -> PaS nevalid"],
    },
    reprezentare_vizuala: [
      "X respecta obversiunea",
      "Y incalca conversiunea pentru A",
    ],
    step_by_step: [
      "La X observ o obversiune corecta a lui A.",
      "La Y observ o conversiune simpla a lui A.",
      "Regula spune ca A nu se converteste simplu.",
      "Deci X este corect, Y este incorect.",
    ],
    de_ce_nu: {
      a: "Nu declar ambele rationamente corecte; Y incalca regula conversiunii pentru A.",
      b: "Nu declar ambele rationamente incorecte; X respecta perfect regula obversiunii.",
      c: "Nu inversez verdictele, fiindca tipurile de operatii sunt diferite.",
      d: "Nu omit justificarea regulii specifice fiecarei operatii.",
    },
    capcana_frecventa:
      "Unii elevi marcheaza rapid ambele rationamente ca fiind corecte pentru ca 'par' simetrice. Simetria verbala nu garanteaza validitatea logica.",
  }),
  card({
    reference: "II.D.c",
    marks: "2p",
    officialText:
      "c. explicati corectitudinea/incorectitudinea logica a rationamentului elevului Y.",
    titlu: "II.D.c - Explicatia pentru rationamentul elevului Y",
    raspuns_corect:
      "Rationamentul lui Y este incorect: el transforma SaP in PaS, adica incearca o conversiune simpla a propozitiei A, operatie nevalida. Termenul P ajunge distribuit in concluzie fara sa fie distribuit in premisa.",
    de_ce_este_corect:
      "In SaP, predicatul P este nedistribuit. In PaS, P devine subiect al unei universale afirmative si este distribuit. Apare astfel o distribuire ilicita a termenului. Din acest motiv, conversiunea simpla a propozitiei A este nevalida; forma corecta, daca s-ar converti, ar fi PiS.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: transformRules,
    cum_gandesti: [
      "Identific forma initiala si forma finala propuse.",
      "Verific ce operatie a fost folosita.",
      "Controlez validitatea operatiei prin regula de distributie sau prin regula formei A.",
    ],
    schema_logica: {
      tip: "distribuire ilicita",
      continut: ["SaP", "PaS", "P nedistribuit in premisa", "P distribuit in concluzie"],
    },
    reprezentare_vizuala: [
      "SaP = tot S in P",
      "PaS ar cere tot P in S",
      "Aceasta relatie nu este garantata",
    ],
    step_by_step: [
      "Pornesc de la SaP.",
      "Observ ca Y inverseaza termenii si pastreaza universalitatea.",
      "Rezultatul este PaS.",
      "Verific distributia lui P: nedistribuit in premisa, distribuit in concluzie.",
      "Conchid ca rationamentul este nevalid.",
    ],
    de_ce_nu: {
      a: "Nu este suficient sa spui doar 'este gresit'; trebuie indicata regula incalcata.",
      b: "Nu explici prin simpla intuitie semantica, ci prin forma SaP si distributia termenilor.",
      c: "Nu confunda eroarea lui Y cu obversiunea; el foloseste o conversiune nepermisa.",
      d: "Nu omite faptul ca forma corecta, daca s-ar converti, ar fi PiS, nu PaS.",
    },
    capcana_frecventa:
      "Multi elevi spun doar ca 'A nu se converteste'. Explicatia buna spune si de ce: distributia termenilor devine ilicita.",
  }),
]
