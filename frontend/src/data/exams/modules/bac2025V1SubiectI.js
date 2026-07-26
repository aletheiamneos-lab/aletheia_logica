import { card } from "./card"

export const v1SubiectIA = [
  card({
    reference: "I.A.1",
    marks: "2p",
    officialText: `1. Daca termenului masina de tocat i se adauga proprietatea carne atunci:
a. extensiunea termenului ramane neschimbata in timp ce intensiunea creste
b. extensiunea si intensiunea raman neschimbate
c. extensiunea termenului creste in timp ce intensiunea scade
d. extensiunea termenului scade in timp ce intensiunea creste`,
    titlu: "I.A.1 - Variatia intensiunii si extensiunii",
    raspuns_corect: "d) extensiunea termenului scade in timp ce intensiunea creste",
    de_ce_este_corect:
      "Adaugarea notei 'carne' mareste continutul logic al termenului 'masina de tocat'. Prin urmare, intensiunea creste. Tocmai pentru ca termenul devine mai determinat, el se aplica unei clase mai restranse de obiecte, deci extensiunea scade. Este aplicata legea variatiei inverse dintre intensiune si extensiune.",
    tip_item: "Raport intre termeni - intensiune / extensiune",
    regula_generala: [
      "Cand adaugi o nota unui termen, intensiunea creste.",
      "Cand intensiunea creste, extensiunea scade.",
      "Intensiunea si extensiunea variaza invers, nu direct.",
    ],
    cum_gandesti: [
      "Verific daca enuntul adauga sau elimina o proprietate termenului.",
      "Daca se adauga o proprietate, marchez imediat: intensiune in sus, extensiune in jos.",
      "Aleg varianta care respecta exact raportul invers.",
    ],
    schema_logica: {
      tip: "lege intensiune-extensiune",
      continut: ["T -> T + N", "Int(T + N) superset Int(T)", "Ext(T + N) subset Ext(T)"],
    },
    reprezentare_vizuala: [
      "T = masina de tocat",
      "T + N = masina de tocat carne",
      "Ext(T + N) este inclusa in Ext(T)",
    ],
    step_by_step: [
      "Pornesc de la termenul initial: 'masina de tocat'.",
      "Observ nota noua: 'carne'.",
      "Mai multe note inseamna continut conceptual mai bogat.",
      "Intensiunea creste.",
      "Clasa obiectelor la care se aplica termenul se restrange.",
    ],
    de_ce_nu: {
      a: "Daca nota adaugata este reala, extensiunea nu poate ramane neschimbata; termenul devine mai restrans.",
      b: "Adaugarea unei note modifica termenul sub raport intensional si extensional, deci ambele nu pot ramane neschimbate.",
      c: "Aceasta varianta inverseaza legea corecta: o nota noua nu largeste clasa obiectelor, ci o restrange.",
      d: "Corect.",
    },
    capcana_frecventa:
      "Elevii retin separat cele doua notiuni, dar uita directia relatiei dintre ele. Regula trebuie memorata ca raport invers fix.",
  }),
  card({
    reference: "I.A.2",
    marks: "2p",
    officialText: `2. Inferenta "Unii avocati nu sunt persoane cunoscute in oras, prin urmare unele persoane cunoscute in oras nu sunt avocati." este:
a. o inductie completa
b. o deductie imediata nevalida
c. o deductie mediata
d. o deductie imediata valida`,
    titlu: "I.A.2 - Inferenta imediata nevalida",
    raspuns_corect: "b) o deductie imediata nevalida",
    de_ce_este_corect:
      "Premisa are forma O: SoP ('Unii S nu sunt P'). Concluzia incearca inversarea termenilor, adica o conversiune: PoS. Conversiunea propozitiei O nu este valida in logica traditionala. Avem deci o inferenta deductiva imediata, dar nevalida.",
    tip_item: "Transformare - inferenta imediata",
    regula_generala: [
      "Mai intai identifici forma initiala A, E, I sau O.",
      "Conversiunea inseamna inversarea termenilor S si P.",
      "Propozitia O nu admite conversiune valida.",
    ],
    cum_gandesti: [
      "Reduc premisa la forma standard A, E, I sau O.",
      "Verific daca in concluzie termenii sunt doar inversati sau exista premise suplimentare.",
      "Daca se converteste o forma neconvertibila, inferenta este imediata nevalida.",
    ],
    schema_logica: {
      tip: "conversiune nevalida",
      continut: ["SoP", "conversiune incercata", "PoS", "nevalid"],
    },
    reprezentare_vizuala: [
      "Premisa: unii S sunt in afara lui P",
      "Concluzia cere: unii P sunt in afara lui S",
      "Aceasta trecere nu este fortata logic",
    ],
    step_by_step: [
      "Identific premisa: 'Unii avocati nu sunt persoane cunoscute in oras'.",
      "O traduc formal: SoP.",
      "Observ ca in concluzie termenii isi schimba locul.",
      "Aceasta este conversiune.",
      "Cum O nu se converteste valid, inferenta este imediata nevalida.",
    ],
    de_ce_nu: {
      a: "Nu avem generalizare de la cazuri particulare la o regula universala, deci nu este inductie.",
      b: "Corect.",
      c: "Nu exista mai multe premise si nici termen mediu; deci nu este deductie mediata.",
      d: "Ar fi valida doar daca forma initiala ar admite conversiune, ceea ce nu se intampla la propozitia O.",
    },
    capcana_frecventa:
      "Enuntul pare plauzibil in limbaj obisnuit, dar in logica formala plauzibilitatea nu inlocuieste regula de transformare.",
  }),
  card({
    reference: "I.A.3",
    marks: "2p",
    officialText: `3. Intre propozitiile categorice "Toate masinile sunt mari." si "Unele masini sunt mari." exista un raport de:
a. contradictie
b. subcontrarietate
c. contrarietate
d. subalternare`,
    titlu: "I.A.3 - Raportul dintre A si I",
    raspuns_corect: "d) subalternare",
    de_ce_este_corect:
      "Prima propozitie are forma A: SaP. A doua are forma I: SiP. In patratul opozitiei, intre A si I exista raport de subalternare: adevarul lui A implica adevarul lui I, cu conditia presupusa a existentei subiectului.",
    tip_item: "Patrat logic",
    regula_generala: [
      "Raporturile din patratul opozitiei se stabilesc numai dupa forma A, E, I sau O.",
      "A si I se afla in raport de subalternare.",
      "Nu confunda subalternarea cu contradictia: contradictoriile nu pot fi simultan adevarate.",
    ],
    cum_gandesti: [
      "Identific forma fiecarei propozitii.",
      "Verific daca termenii S si P raman identici.",
      "Caut raportul dintre formele rezultate in patratul opozitiei.",
    ],
    schema_logica: {
      tip: "patratul opozitiei",
      continut: ["SaP", "SiP", "A -> I"],
    },
    reprezentare_vizuala: ["A sus-stanga", "I jos-stanga", "A - I = subalternare"],
    step_by_step: [
      "Traduc prima propozitie: SaP.",
      "Traduc a doua propozitie: SiP.",
      "Observ ca termenii sunt aceiasi.",
      "Compar doar forma logica: A versus I.",
      "Concluzionez: subalternare.",
    ],
    de_ce_nu: {
      a: "Contradictoria lui A este O, nu I.",
      b: "Subcontrarietatea exista intre I si O, nu intre A si I.",
      c: "Contrarietatea exista intre A si E, nu intre A si I.",
      d: "Corect.",
    },
    capcana_frecventa:
      "Elevii aleg contradictie fiindca una e universala si alta particulara. Raportul nu depinde doar de cantitate, ci de perechea exacta A/E/I/O.",
  }),
  card({
    reference: "I.A.4",
    marks: "2p",
    officialText: `4. Subiectul logic al propozitiei "Majoritatea cartilor de vizita sunt ale oamenilor de afaceri." este:
a. majoritatea cartilor
b. cartile
c. cartilor de vizita
d. oamenilor de afaceri`,
    titlu: "I.A.4 - Subiectul logic",
    raspuns_corect: 'c) "cartilor de vizita"',
    de_ce_este_corect:
      "Subiectul logic este termenul despre care se afirma ceva in propozitie. In enuntul dat, despre 'cartile de vizita' se afirma ca sunt ale oamenilor de afaceri. Cuantorul 'majoritatea' nu face parte din termenul-subiect propriu-zis, ci arata cantitatea pentru care se face afirmatia.",
    tip_item: "Patrat logic - structura propozitiei categorice",
    regula_generala: [
      "Subiectul logic este termenul despre care se afirma sau se neaga ceva.",
      "Cuantorul nu se confunda cu termenul-subiect.",
      "Predicatul logic este termenul atribuit sau negat fata de subiect.",
    ],
    cum_gandesti: [
      "Separ mai intai cuantorul de continutul termenului.",
      "Intreb: despre ce clasa se spune ceva?",
      "Aleg doar termenul-subiect, nu expresia cuantificata intreaga.",
    ],
    schema_logica: {
      tip: "structura propozitiei",
      continut: ["majoritatea = cuantor", "S = carti de vizita", "P = ale oamenilor de afaceri"],
    },
    reprezentare_vizuala: [
      "Cuantor: majoritatea",
      "Subiect: carti de vizita",
      "Predicat: ale oamenilor de afaceri",
    ],
    step_by_step: [
      "Citesc enuntul si separ expresia cuantificatoare.",
      "Vad ca termenul despre care se afirma ceva este 'carti de vizita'.",
      "Predicatul este ceea ce se spune despre ele.",
      "Concluzia: subiectul logic este 'cartilor de vizita'.",
    ],
    de_ce_nu: {
      a: "Include cuantorul in termenul-subiect, ceea ce este gresit din punct de vedere logic.",
      b: "Este prea larg; enuntul nu vorbeste despre toate cartile, ci despre cartile de vizita.",
      c: "Corect.",
      d: "Acesta este termenul-predicat, nu termenul-subiect.",
    },
    capcana_frecventa:
      "Elevii iau adesea cuantorul impreuna cu termenul. In analiza logica, cuantorul se separa de subiect.",
  }),
  card({
    reference: "I.A.5",
    marks: "2p",
    officialText: `5. O clasificare corecta presupune respectarea regulii:
a. consistentei
b. claritatii si preciziei
c. adecvarii
d. omogenitatii`,
    titlu: "I.A.5 - Regula clasificarii",
    raspuns_corect: "d) omogenitatii",
    de_ce_este_corect:
      "Clasificarea corecta cere folosirea aceluiasi criteriu pe toate ramurile rezultate. Aceasta cerinta poarta numele de omogenitate. Daca fundamentul clasificarii se schimba de la o clasa la alta, clasificarea devine logic incorecta.",
    tip_item: "Clasificare logica",
    regula_generala: [
      "O clasificare corecta foloseste un singur criteriu pe aceeasi treapta.",
      "Clasele trebuie sa fie omogene in raport cu fundamentul folosit.",
      "Regulile claritatii si adecvarii sunt importante, dar nu inlocuiesc criteriul unic al clasificarii.",
    ],
    cum_gandesti: [
      "Verific mai intai ce regula este specifica clasificarii, nu definitiei.",
      "Ma intreb daca ramurile trebuie sa urmeze acelasi fundament.",
      "Daca da, regula cautata este omogenitatea.",
    ],
    schema_logica: {
      tip: "criteriu de clasificare",
      continut: ["criteriu unic", "ramuri omogene", "=> clasificare corecta"],
    },
    reprezentare_vizuala: [
      "Gen",
      "|-- specie 1 (acelasi criteriu)",
      "|-- specie 2 (acelasi criteriu)",
    ],
    step_by_step: [
      "Identific domeniul: clasificarea.",
      "Stiu ca aici regula centrala este criteriul unic.",
      "Numele logic al acestei reguli este omogenitatea.",
    ],
    de_ce_nu: {
      a: "Consistenta nu este regula specifica de baza prin care se verifica o clasificare scolara.",
      b: "Claritarea si precizia sunt invocate mai ales in analiza definitiilor.",
      c: "Adecvarea priveste in special raportul dintre definit si definitor, nu fundamentul clasificarii.",
      d: "Corect.",
    },
    capcana_frecventa:
      "Itemii de clasificare introduc adesea distractori din teoria definitiei. Trebuie separat capitolul corect inainte de alegerea raspunsului.",
  }),
  card({
    reference: "I.A.6",
    marks: "2p",
    officialText: `6. Din punct de vedere intensional, termenul frumusete este:
a. nevid
b. abstract
c. negativ
d. compus`,
    titlu: "I.A.6 - Termen abstract",
    raspuns_corect: "b) abstract",
    de_ce_este_corect:
      "Termenul 'frumusete' nu desemneaza un obiect concret, ci o insusire sau o calitate. In clasificarea intensionala, termenii care exprima proprietati, stari sau relatii sunt abstracti. De aceea raspunsul corect este 'abstract'.",
    tip_item: "Clasificare a termenilor",
    regula_generala: [
      "Clasificarea intensionala priveste natura continutului termenului.",
      "Termenii care exprima obiecte sunt concreti, iar cei care exprima insusiri sunt abstracti.",
      "Trebuie respectat criteriul cerut in enunt: intensional, nu extensional.",
    ],
    cum_gandesti: [
      "Observ criteriul explicit: 'din punct de vedere intensional'.",
      "Verific daca termenul denumeste obiect sau proprietate.",
      "Daca denumeste o insusire, aleg 'abstract'.",
    ],
    schema_logica: {
      tip: "clasificare intensionala",
      continut: ["termen de proprietate", "=> abstract"],
    },
    reprezentare_vizuala: ["obiect -> concret", "insusire -> abstract"],
    step_by_step: [
      "Fixez planul corect al clasificarii: intensional.",
      "Analizez semnificatia termenului 'frumusete'.",
      "Constat ca el denumeste o calitate, nu un obiect.",
      "Rezulta: termen abstract.",
    ],
    de_ce_nu: {
      a: "Nevidul este o clasificare extensionala, nu intensionala.",
      b: "Corect.",
      c: "Termenul nu este negativ doar pentru ca nu are prefix de negatie si nu exprima absenta unei proprietati.",
      d: "Numarul de cuvinte nu este criteriul relevant aici; enuntul cere tipul intensional, nu structura simpla/compusa.",
    },
    capcana_frecventa:
      "Multe variante sunt corecte in alte clasificari ale termenilor. Trebuie urmat strict criteriul cerut in item.",
  }),
  card({
    reference: "I.A.7",
    marks: "2p",
    officialText: `7. Rationamentul "Unele conflicte nu sunt gestionate corect, deci unele conflicte sunt gestionate incorect." este:
a. obversiune valida
b. conversiune nevalida
c. inductie completa
d. inductie incompleta`,
    titlu: "I.A.7 - Obversiune valida",
    raspuns_corect: "a) obversiune valida",
    de_ce_este_corect:
      "Premisa are forma O: SoP ('Unele S nu sunt P'). Prin obversiune, se schimba calitatea propozitiei si se complementeaza predicatul. Rezultatul este o propozitie I cu predicat complementar: Si~P ('Unele S sunt non-P'). Exact aceasta structura apare in concluzie, deci rationamentul este o obversiune valida.",
    tip_item: "Transformare - obversiune",
    regula_generala: [
      "Obversiunea schimba calitatea propozitiei.",
      "La obversiune se complementeaza predicatul, nu subiectul.",
      "Forma O se transforma valid in I cu predicat complementar.",
    ],
    cum_gandesti: [
      "Identific forma initiala A, E, I sau O.",
      "Verific daca termenii isi schimba locul sau doar predicatul devine complementar.",
      "Daca se schimba calitatea si se complementeaza predicatul, am obversiune.",
    ],
    schema_logica: {
      tip: "obversiune",
      continut: ["SoP", "obversiune", "Si~P"],
    },
    reprezentare_vizuala: [
      "Unele S nu sunt P",
      "=> Unele S sunt non-P",
    ],
    step_by_step: [
      "Traduc premisa: SoP.",
      "Observ ca termenii nu isi schimba locul.",
      "Calitatea se schimba din negativa in afirmativa.",
      "Predicatul devine complementar.",
      "Concluzia corespunde exact obversiunii valide.",
    ],
    de_ce_nu: {
      a: "Corect.",
      b: "Conversiunea ar fi presupus schimbarea locului termenilor S si P, ceea ce nu se intampla aici.",
      c: "Nu exista generalizare de la totalitatea cazurilor, deci nu este inductie.",
      d: "Nu exista generalizare probabilista de la unele cazuri la un enunt mai larg; structura este una deductiva imediata.",
    },
    capcana_frecventa:
      "Elevii confunda usor obversiunea cu conversiunea. Cheia este sa verifici daca termenii isi schimba sau nu locul.",
  }),
  card({
    reference: "I.A.8",
    marks: "2p",
    officialText: `8. Propozitia "Unii actori nu sunt cantareti." este un exemplu de propozitie:
a. universala afirmativa
b. particulara negativa
c. universala negativa
d. particulara afirmativa`,
    titlu: "I.A.8 - Propozitie particulara negativa",
    raspuns_corect: "b) particulara negativa",
    de_ce_este_corect:
      "Cuantorul 'Unii' indica particularul, iar relatia 'nu sunt' indica negativitatea. Combinatia dintre cantitate particulara si calitate negativa determina forma O. De aceea propozitia este particulara negativa.",
    tip_item: "Patrat logic - identificarea formei",
    regula_generala: [
      "Cantitatea se identifica prin cuantor.",
      "Calitatea se identifica prin afirmatie sau negatie.",
      "Particular + negativ = forma O.",
    ],
    cum_gandesti: [
      "Extragi separat cantitatea si calitatea.",
      "Asociezi cuantorul cu particularul sau universalul.",
      "Combini rezultatele si alegi tipul A, E, I sau O.",
    ],
    schema_logica: {
      tip: "forma O",
      continut: ["unii", "nu sunt", "=> O"],
    },
    reprezentare_vizuala: ["Cantitate: particular", "Calitate: negativa", "Rezultat: O"],
    step_by_step: [
      "Citesc cuantorul: 'Unii'.",
      "Stabilesc: propozitie particulara.",
      "Citesc copula negativa: 'nu sunt'.",
      "Stabilesc: propozitie negativa.",
      "Combin: particulara negativa.",
    ],
    de_ce_nu: {
      a: "Universala afirmativa ar cere cuantor total si absenta negatiei, conditii care nu sunt indeplinite aici.",
      b: "Corect.",
      c: "Negativitatea este prezenta, dar universalitatea lipseste.",
      d: "Cantitatea este particulara, dar calitatea nu este afirmativa.",
    },
    capcana_frecventa:
      "Elevii identifica uneori doar negatia si aleg forma E. Trebuie verificata si cantitatea, nu doar calitatea.",
  }),
  card({
    reference: "I.A.9",
    marks: "2p",
    officialText: `9. O inferenta deductiva mediata presupune existenta:
a. unui fundament al demonstratiei
b. mai multor premise
c. unei singure premise
d. unui criteriu de clasificare`,
    titlu: "I.A.9 - Deducerea mediata",
    raspuns_corect: "b) mai multor premise",
    de_ce_este_corect:
      "O inferenta deductiva mediata nu ajunge la concluzie prin transformarea unei singure propozitii, ci prin intermediul a cel putin doua premise. Modelul clasic este silogismul, unde concluzia rezulta din combinarea premisei majore cu premisa minora prin termenul mediu.",
    tip_item: "Silogism",
    regula_generala: [
      "Deducerea imediata porneste dintr-o singura premisa.",
      "Deducerea mediata presupune cel putin doua premise.",
      "Silogismul este forma clasica de deductie mediata.",
    ],
    cum_gandesti: [
      "Compar deducerea imediata cu cea mediata.",
      "Vad daca este nevoie de termen mediu si de combinarea premiselor.",
      "Daca raspunsul cere structura minima a deductiei mediate, aleg varianta cu mai multe premise.",
    ],
    schema_logica: {
      tip: "inferenta mediata",
      continut: ["Premisa 1", "Premisa 2", "=> Concluzie"],
    },
    reprezentare_vizuala: [
      "Premisa majora",
      "Premisa minora",
      "Concluzie",
    ],
    step_by_step: [
      "Fixez diferenta dintre deducerea imediata si cea mediata.",
      "Observ ca deducerea mediata introduce o trecere prin premise multiple.",
      "Modelul de referinta este silogismul.",
      "Conchid: sunt necesare mai multe premise.",
    ],
    de_ce_nu: {
      a: "Fundamentul demonstratiei este alt concept si nu exprima structura minima a unei inferente deductive mediate.",
      b: "Corect.",
      c: "O singura premisa este specifica deductiei imediate, nu deducerii mediate.",
      d: "Criteriul de clasificare apartine altui capitol logic si nu defineste o inferenta.",
    },
    capcana_frecventa:
      "Unii elevi aleg termeni care suna tehnic fara sa raspunda exact la intrebare. Itemul cere structura minima, nu orice concept din argumentare.",
  }),
  card({
    reference: "I.A.10",
    marks: "2p",
    officialText: `10. Propozitiei categorice "Niciun elev nu este persoana cu studii superioare." ii corespunde formula:
a. SaP
b. SeP
c. SoP
d. SiP`,
    titlu: "I.A.10 - Formula categorica",
    raspuns_corect: "b) SeP",
    de_ce_este_corect:
      "Enuntul are forma 'Niciun S nu este P', adica universala negativa. In notatia scolara, aceasta forma se scrie SeP. Subiectul este 'elev', iar predicatul este 'persoana cu studii superioare'.",
    tip_item: "Patrat logic - formula categorica",
    regula_generala: [
      "Forma E corespunde tiparului 'Niciun S nu este P'.",
      "Forma O corespunde tiparului 'Unii S nu sunt P'.",
      "Pentru scrierea formala trebuie mai intai identificate cantitatea si calitatea.",
    ],
    cum_gandesti: [
      "Recunosc tiparul verbal al propozitiei.",
      "Stabilesc daca este universala sau particulara si daca este afirmativa sau negativa.",
      "Transform rezultatul in notatia SaP, SeP, SiP sau SoP.",
    ],
    schema_logica: {
      tip: "forma E",
      continut: ["Niciun S nu este P", "=> SeP"],
    },
    reprezentare_vizuala: [
      "S = elev",
      "P = persoana cu studii superioare",
      "S intersect P = vida",
    ],
    step_by_step: [
      "Identific expresia 'Niciun ... nu este ...'.",
      "Stabilesc: universala negativa.",
      "Forma universalei negative este E.",
      "Scriu formula: SeP.",
    ],
    de_ce_nu: {
      a: "SaP este universala afirmativa, iar enuntul dat este negativ.",
      b: "Corect.",
      c: "SoP ar cere cuantor particular, de tip 'Unii'.",
      d: "SiP este particulara afirmativa, deci nu corespunde enuntului.",
    },
    capcana_frecventa:
      "Unii elevi se grabesc si aleg SoP doar pentru ca vad negatia. Trebuie verificata si cantitatea: aici este universala, nu particulara.",
  }),
]

export const v1SubiectIB1 = [
  card({
    reference: "I.B.1",
    title: "I.B.1 - Diagrama Euler comuna",
    marks: "2p",
    officialText:
      "B. Se dau termenii A, B, C, D si E astfel incat termenii A, B si C se afla in raport de incrucisare; iar termenul D este specie a intersectiei acestora; termenul E este in raport de contrarietate cu ceilalti termeni.\n" +
      "1. Reprezentati, prin metoda diagramelor Euler, pe o diagrama comuna, raporturile logice dintre cei cinci termeni.",
    answer: "Diagrama corecta plaseaza D in intersectia comuna A-B-C, iar E separat de toti ceilalti.",
    justification:
      "Daca A, B si C se incruciseaza, fiecare are zone proprii si zone comune. D fiind specie a intersectiei intra complet in centrul comun. E, fiind contrar cu toti ceilalti, ramane separat.",
    steps: [
      "Desenezi mai intai trei cercuri A, B si C care se incruciseaza doua cate doua si toate trei impreuna.",
      "Plasezi D complet in zona centrala comuna A intersect B intersect C.",
      "Asezi E separat de toate celelalte cercuri.",
    ],
    schema: [
      "A intersect B != 0",
      "A intersect C != 0",
      "B intersect C != 0",
      "D subset A intersect B intersect C",
      "E intersect A = 0",
      "E intersect B = 0",
      "E intersect C = 0",
      "E intersect D = 0",
    ],
    commonTrap:
      "D nu trebuie desenat doar intr-o intersectie de doua multimi, ci in intersectia tuturor celor trei: A, B si C.",
  }),
]

const v1B2Raw = [
  ["I.B.2.a", "a) Niciun C nu este A.", "F", "A si C se afla in raport de incrucisare, deci au zona comuna.", ["A intersect C != 0"]],
  ["I.B.2.b", "b) Unii A nu sunt B.", "A", "Incrucisarea inseamna ca A are si parte in afara lui B.", ["A intersect B != 0", "A \\ B != 0"]],
  ["I.B.2.c", "c) Unii A sunt D.", "A", "D este inclus in intersectia A-B-C, deci orice D este si A.", ["D subset A"]],
  ["I.B.2.d", "d) Unii D nu sunt E.", "A", "E este contrar cu D, deci niciun D nu este E. Cu atat mai mult, unii D nu sunt E.", ["D intersect E = 0"]],
  ["I.B.2.e", "e) Toti D sunt C.", "A", "D este specie a intersectiei A-B-C, deci este inclus si in C.", ["D subset C"]],
  ["I.B.2.f", "f) Niciun B nu este C.", "F", "B si C se incruciseaza, deci exista elemente comune.", ["B intersect C != 0"]],
  ["I.B.2.g", "g) Unii E nu sunt A.", "A", "E este contrar cu A, deci orice E se afla in afara lui A.", ["E intersect A = 0"]],
  ["I.B.2.h", "h) Unii D sunt A.", "A", "D este inclus in A, deci orice element din D este si A.", ["D subset A"]],
]

export const v1SubiectIB2 = v1B2Raw.map(([reference, statement, answer, justification, schema]) =>
  card({
    reference,
    title: `${reference} - Verdict`,
    marks: "1p",
    officialText: statement,
    answer,
    justification,
    steps: [
      "Pornesti de la diagrama construita la I.B.1.",
      "Verifici daca relatia enuntata este fortata de diagrama sau o contrazice.",
      "Abia apoi notezi A sau F.",
    ],
    schema,
    commonTrap:
      "La aceste iteme nu merge intuitia verbala. Verdictul trebuie citit direct din diagrama Euler.",
  }),
)
