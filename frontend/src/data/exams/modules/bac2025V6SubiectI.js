import { card } from "./card"

export const v6SubiectIA = [
  card({
    reference: "I.A.1",
    marks: "2p",
    officialText: `1. Daca termenului problema i se adauga proprietatea controversata atunci:
a. extensiunea termenului creste in timp ce intensiunea scade
b. extensiunea termenului scade in timp ce intensiunea creste
c. extensiunea termenului ramane neschimbata in timp ce intensiunea creste
d. extensiunea si intensiunea raman neschimbate`,
    titlu: "I.A.1 - Variatia intensiunii si extensiunii",
    raspuns_corect: "b) extensiunea termenului scade in timp ce intensiunea creste",
    de_ce_este_corect:
      "Prin adaugarea notei 'controversata', termenul primeste continut logic suplimentar. Deci intensiunea lui creste. Tocmai pentru ca devine mai determinat, el se aplica unei clase mai restranse de obiecte, astfel incat extensiunea scade. Legea folosita este variatia inversa dintre intensiune si extensiune.",
    tip_item: "Raport intre termeni - intensiune / extensiune",
    regula_generala: [
      "Adaugarea unei note intensionale mareste continutul conceptului.",
      "Cand intensiunea creste, extensiunea scade.",
      "Cand extensiunea creste, intensiunea scade.",
    ],
    cum_gandesti: [
      "Verific daca termenului i se adauga sau i se elimina o proprietate.",
      "Daca se adauga o proprietate, marchez imediat: intensiune in sus, extensiune in jos.",
      "Aleg varianta care respecta strict raportul invers.",
    ],
    schema_logica: {
      tip: "lege intensiune-extensiune",
      continut: ["T -> T + N", "Int(T + N) superset Int(T)", "Ext(T + N) subset Ext(T)"],
    },
    reprezentare_vizuala: [
      "T = problema",
      "T + N = problema controversata",
      "Ext(T + N) sta in interiorul lui Ext(T)",
    ],
    step_by_step: [
      "Pornesc de la termenul initial: 'problema'.",
      "Observ operatia: i se adauga nota 'controversata'.",
      "Un termen cu mai multe note are continut mai bogat.",
      "Prin urmare, intensiunea creste.",
      "Cum termenul devine mai restrictiv, extensiunea lui scade.",
    ],
    de_ce_nu: {
      a: "Aceasta varianta inverseaza legea corecta. Adaugarea unei note nu largeste clasa obiectelor, ci o restrange.",
      b: "Corect.",
      c: "Daca nota adaugata este reala si nu redundanta, extensiunea nu poate ramane aceeasi; ea se restrange.",
      d: "O schimbare intensionala reala modifica raportul de aplicare al termenului; deci nici intensiunea, nici extensiunea nu raman neschimbate.",
    },
    capcana_frecventa:
      "Elevii retin separat 'intensiune' si 'extensiune', dar uita directia relatiei dintre ele. Regula este mereu inversa.",
  }),
  card({
    reference: "I.A.2",
    marks: "2p",
    officialText: `2. Rationamentul "Unele programe fara invatare automata nu sunt tehnologii utilizate in dezvoltarea AI fiindca nicio tehnologie utilizata in dezvoltarea AI nu este program fara invatare automata." este:
a. o conversiune simpla
b. o obversiune
c. un silogism
d. o conversiune prin accident`,
    titlu: "I.A.2 - Identificarea tipului de rationament",
    raspuns_corect: "c) un silogism",
    de_ce_este_corect:
      "Concluzia nu este obtinuta prin simpla transformare a unei singure propozitii, asa cum s-ar intampla la conversiune sau obversiune. Ea este prezentata ca rezultand dintr-o premisa explicita de tip E ('Niciun P nu este S') si dintr-o premisa existentiala subinteleasa privind existenta unor S. Prin urmare, structura este una de inferenta deductiva mediata, adica silogistica.",
    tip_item: "Silogism",
    regula_generala: [
      "Un silogism este o inferenta deductiva mediata: concluzia rezulta prin intermediul premiselor, nu prin transformarea unei singure propozitii.",
      "Conversiunea si obversiunea sunt inferente imediate: ele opereaza pe o singura propozitie de plecare.",
      "Daca raspunsul cere tipul rationamentului, verifici mai intai daca exista premisa si concluzie sau doar o formula transformata.",
    ],
    cum_gandesti: [
      "Caut daca enuntul are structura premisa -> concluzie.",
      "Verific daca rezultatul iese din combinarea premiselor sau doar din schimbarea unei singure propozitii.",
      "Daca ai rationare mediata, alegi 'silogism'.",
    ],
    schema_logica: {
      tip: "inferenta mediata",
      continut: ["Premisa: PeS", "Premisa subinteleasa: Ex(S)", "Concluzie: SoP"],
    },
    reprezentare_vizuala: [
      "Premisa explicita: niciun P nu este S",
      "Exista S",
      "Deci unele S sunt in afara lui P",
    ],
    step_by_step: [
      "Separ enuntul in doua parti: concluzia afirmata si justificarea introdusa prin 'fiindca'.",
      "Observ ca nu am o simpla inversare de termeni si nici o complementare de predicat.",
      "Forma rezultatului depinde de premisa invocata, nu doar de o operatie pe aceeasi propozitie.",
      "Rezultatul este o inferenta deductiva mediata.",
    ],
    de_ce_nu: {
      a: "Conversiunea simpla ar cere doar schimbarea locului termenilor intr-o propozitie convertibila. Aici nu ai o singura propozitie transformata, ci o concluzie sustinuta de o premisa.",
      b: "Obversiunea schimba calitatea propozitiei si complementeaza predicatul. In enuntul dat nu apare o astfel de operatie unica.",
      c: "Corect.",
      d: "Conversiunea prin accident este specifica propozitiei A, de tip 'Toti S sunt P -> Unii P sunt S'. Premisa explicita de aici este negativa, nu universala afirmativa.",
    },
    capcana_frecventa:
      "Elevii vad o propozitie negativa in concluzie si o asociaza imediat cu o transformare. Mai intai trebuie verificat daca exista premisa si concluzie distincte.",
  }),
  card({
    reference: "I.A.3",
    marks: "2p",
    officialText: `3. Se afla in raport de ordonare termenii:
a. conversiune simpla valida - conversiune simpla nevalida
b. conversiune simpla - rationament deductiv imediat
c. silogism de figura I - silogism de figura a II-a
d. obversiune - inductie incompleta`,
    titlu: "I.A.3 - Raport de ordonare",
    raspuns_corect: "b) conversiune simpla - rationament deductiv imediat",
    de_ce_este_corect:
      "Raportul de ordonare este un raport de includere a extensiunilor: extensiunea speciei este cuprinsa in extensiunea genului. 'Conversiune simpla' desemneaza o specie de rationament deductiv imediat. Deci tot ce este conversiune simpla este rationament deductiv imediat, fara ca reciproca sa fie adevarata.",
    tip_item: "Raport intre termeni",
    regula_generala: [
      "In ordonare, un termen este specie, iar celalalt este gen.",
      "Formal, extensiunea speciei este inclusa in extensiunea genului.",
      "Daca ambii termeni sunt specii paralele ale aceluiasi gen, nu mai ai ordonare, ci coordonare.",
    ],
    cum_gandesti: [
      "Verific daca unul dintre termeni intra integral in celalalt.",
      "Daca am specie si gen, aleg ordonare.",
      "Daca am doua specii de acelasi nivel, elimin varianta.",
    ],
    schema_logica: {
      tip: "incluziune",
      continut: ["Ext(conversiune simpla) subset Ext(rationament deductiv imediat)"],
    },
    reprezentare_vizuala: [
      "Rationament deductiv imediat",
      "|-- conversiune simpla",
      "|-- obversiune",
    ],
    step_by_step: [
      "Citesc cei doi termeni ca extensiuni, nu ca formulare verbala.",
      "Vad daca primul poate fi tratat ca specie a celui de-al doilea.",
      "Constat ca 'conversiune simpla' este doar un caz al genului 'rationament deductiv imediat'.",
      "Deci raportul este de ordonare.",
    ],
    de_ce_nu: {
      a: "Aici nu exista includere, ci doua subclase opuse in raport cu validitatea. Nici una nu o contine pe cealalta.",
      b: "Corect.",
      c: "Figura I si figura a II-a sunt doua specii paralele ale genului 'silogism'; ele nu sunt una inclusa in cealalta.",
      d: "Obversiunea apartine deductiei imediate, iar inductia incompleta apartine inductiei. Intre ele nu exista raport de specie-gen.",
    },
    capcana_frecventa:
      "Elevii confunda ordonarea cu simpla inrudire tematica. Nu este suficient ca termenii sa tina de logica; trebuie sa existe includere reala.",
  }),
  card({
    reference: "I.A.4",
    marks: "2p",
    officialText: `4. Cuantorul propozitiei "Niciun mamifer acvatic nu este dotat cu branhii." este:
a. particular
b. afirmativ
c. universal
d. negativ`,
    titlu: "I.A.4 - Cuantor universal",
    raspuns_corect: "c) universal",
    de_ce_este_corect:
      "Expresia 'niciun' cuantifica intreaga clasa a subiectului. Ea nu selecteaza doar o parte a clasei, ci afirma despre fiecare element din extensiunea subiectului ca nu intra in extensiunea predicatului. De aceea propozitia este universala negativa, iar cuantorul este universal.",
    tip_item: "Patrat logic - identificarea cuantorului",
    regula_generala: [
      "Cuantorul arata cat din clasa subiectului este vizat de propozitie.",
      "'Toti' si 'niciun' sunt cuantori universali.",
      "Calitatea afirmativa sau negativa a propozitiei nu trebuie confundata cu tipul cuantorului.",
    ],
    cum_gandesti: [
      "Identific mai intai expresia cuantificatoare.",
      "Separ cantitatea de calitate: cuantorul spune cat, negatia spune cum.",
      "Daca apare 'niciun', raspunsul corect este universal.",
    ],
    schema_logica: {
      tip: "forma categorica",
      continut: ["Niciun S nu este P", "cantitate = universala", "calitate = negativa"],
    },
    reprezentare_vizuala: [
      "Clasa S este luata integral",
      "S intersect P = vida",
    ],
    step_by_step: [
      "Observ expresia-cheie: 'niciun'.",
      "Aceasta priveste intreaga extensiune a subiectului.",
      "Negativitatea vine din relatia 'nu este', nu din cuantor.",
      "Concluzia: cuantor universal.",
    ],
    de_ce_nu: {
      a: "Particularul ar fi marcat prin 'unii', 'unele', 'multe', 'majoritatea', nu prin 'niciun'.",
      b: "Afirmativul si negativul indica tipul calitatii propozitiei, nu cuantorul.",
      c: "Corect.",
      d: "Negativitatea descrie calitatea propozitiei, nu tipul cuantorului.",
    },
    capcana_frecventa:
      "Multi aleg 'negativ' fiindca vad negatia in enunt. Intrebarea nu cere calitatea propozitiei, ci cuantorul.",
  }),
  card({
    reference: "I.A.5",
    marks: "2p",
    officialText: `5. Clasificarea animalelor in clasele domestice, salbatice, patrupede si bipede este:
a. inadecvata
b. corecta
c. completa
d. incorecta`,
    titlu: "I.A.5 - Clasificare incorecta",
    raspuns_corect: "d) incorecta",
    de_ce_este_corect:
      "Clasificarea este incorecta deoarece nu respecta regula criteriului unic. Clasele 'domestice' si 'salbatice' folosesc criteriul relatiei cu omul, in timp ce 'patrupede' si 'bipede' folosesc criteriul modului de locomotie. O clasificare corecta trebuie sa foloseasca acelasi fundament pe aceeasi treapta.",
    tip_item: "Clasificare logica",
    regula_generala: [
      "O clasificare corecta foloseste un singur criteriu pe aceeasi treapta.",
      "Clasele rezultate trebuie sa fie omogene sub raportul fundamentului folosit.",
      "Schimbarea criteriului transforma clasificarea intr-una incorecta, chiar daca termenii folositi sunt inteligibili.",
    ],
    cum_gandesti: [
      "Identific domeniul care se clasifica.",
      "Verific daca toate clasele sunt obtinute dupa acelasi criteriu.",
      "Daca apar doua criterii diferite, aleg varianta 'incorecta'.",
    ],
    schema_logica: {
      tip: "criteriu de clasificare",
      continut: ["criteriu_1 != criteriu_2", "=> clasificare incorecta"],
    },
    reprezentare_vizuala: [
      "Animale",
      "|-- domestice / salbatice -> criteriul relatiei cu omul",
      "|-- patrupede / bipede -> criteriul locomotiei",
    ],
    step_by_step: [
      "Domeniul comun este 'animale'.",
      "Primele doua clase separa animalele dupa raportarea la om.",
      "Urmatoarele doua clase separa animalele dupa numarul de membre folosite in locomotie.",
      "Criteriul nu mai este acelasi.",
      "Clasificarea devine logic incorecta.",
    ],
    de_ce_nu: {
      a: "Problema centrala nu este adecvarea extensiunii definitiei, ci amestecul de criterii pe aceeasi treapta.",
      b: "O clasificare corecta ar cere acelasi fundament pentru toate clasele rezultate; aici fundamentul se schimba.",
      c: "Completitudinea priveste acoperirea domeniului, dar eroarea decisiva de aici este lipsa criteriului unic.",
      d: "Corect.",
    },
    capcana_frecventa:
      "Elevii cred ca daca exemplele suna natural, clasificarea este buna. In logica, problema decisiva este criteriul, nu familiaritatea termenilor.",
  }),
  card({
    reference: "I.A.6",
    marks: "2p",
    officialText: `6. Din punct de vedere extensional, termenul rezolvare incompleta este:
a. precis, relativ
b. negativ, compus
c. nevid, general
d. vid, absolut`,
    titlu: "I.A.6 - Termen nevid si general",
    raspuns_corect: "c) nevid, general",
    de_ce_este_corect:
      "Clasificarea ceruta este extensionala. Un termen este nevid daca are obiecte in extensiune si este general daca se aplica unei pluralitati de indivizi, nu unui singur individ. 'Rezolvare incompleta' are numeroase cazuri reale, deci extensiunea lui nu este vida si nu este singulara.",
    tip_item: "Clasificare a termenilor",
    regula_generala: [
      "Clasificarea extensionala priveste existenta si marimea extensiunii unui termen.",
      "Termenul este vid daca nu are niciun obiect in extensiune si nevid daca are cel putin unul.",
      "Termenul este general daca se aplica mai multor indivizi, nu unui singur exemplar.",
    ],
    cum_gandesti: [
      "Verific mai intai daca termenul are referinti reali.",
      "Verific apoi daca desemneaza un singur caz sau o clasa intreaga.",
      "Daca exista mai multe cazuri reale, raspunsul este 'nevid, general'.",
    ],
    schema_logica: {
      tip: "clasificare extensionala",
      continut: ["Ext(T) != vida", "|Ext(T)| > 1"],
    },
    reprezentare_vizuala: [
      "rezolvare incompleta 1",
      "rezolvare incompleta 2",
      "rezolvare incompleta 3",
    ],
    step_by_step: [
      "Intrebarea cere explicit perspectiva extensionala.",
      "Caut daca exista rezolvari incomplete in realitate: da.",
      "Observ ca nu este vorba despre un singur obiect, ci despre o multime de cazuri.",
      "Deci termenul este nevid si general.",
    ],
    de_ce_nu: {
      a: "Aceasta varianta foloseste criterii care nu raspund la intrebare. 'Precis' si 'relativ' nu sunt perechea extensionala ceruta aici.",
      b: "Si aceasta varianta schimba planul de clasificare. 'Negativ' si 'compus' tin de alte criterii decat clasificarea extensionala solicitata.",
      c: "Corect.",
      d: "Termenul nu este vid, pentru ca exista astfel de cazuri. Nici 'absolut' nu raspunde problemei extensionale cerute in item.",
    },
    capcana_frecventa:
      "Itemul amesteca deliberate perechi din criterii diferite. Daca nu observi expresia 'din punct de vedere extensional', alegi o varianta din alt plan.",
  }),
  card({
    reference: "I.A.7",
    marks: "2p",
    officialText: `7. Predicatul logic al propozitiei "Unele lalele sunt albe" este:
a. unele
b. multe lalele
c. sunt albe
d. albe`,
    titlu: "I.A.7 - Predicatul logic",
    raspuns_corect: "d) albe",
    de_ce_este_corect:
      "In forma categoriala 'Unele S sunt P', termenul P este predicatul logic. El exprima insusirea atribuita subiectului. In enuntul dat, despre unele lalele se afirma proprietatea de a fi albe, deci predicatul logic este termenul 'albe'.",
    tip_item: "Patrat logic - structura propozitiei categorice",
    regula_generala: [
      "Subiectul logic este termenul despre care se afirma ceva.",
      "Predicatul logic este termenul care exprima insusirea sau clasa atribuita subiectului.",
      "Cuantorul si copula nu se confunda cu termenii logici ai propozitiei.",
    ],
    cum_gandesti: [
      "Reduc propozitia la forma 'Unele S sunt P'.",
      "Identific separat cuantorul, subiectul si copula.",
      "Ceea ce ramane ca termen atribuit subiectului este predicatul logic.",
    ],
    schema_logica: {
      tip: "forma I",
      continut: ["Unele S sunt P", "S = lalele", "P = albe"],
    },
    reprezentare_vizuala: [
      "Unele = cuantor",
      "lalele = subiect",
      "albe = predicat",
    ],
    step_by_step: [
      "Identific cuantorul: 'unele'.",
      "Identific subiectul logic: 'lalele'.",
      "Copula este 'sunt'.",
      "Termenul atribuit subiectului este 'albe'.",
    ],
    de_ce_nu: {
      a: " 'Unele' este cuantorul particular, nu predicatul logic.",
      b: "Aceasta expresie introduce o alta formulare a subiectului, nu termenul-predicat din enunt.",
      c: " 'Sunt albe' este predicat gramatical, dar logica scolara cere termenul-predicat, adica numai partea notionala 'albe'.",
      d: "Corect.",
    },
    capcana_frecventa:
      "Elevii confunda predicatul gramatical cu predicatul logic. In logica, cauti termenul P, nu intreaga structura verbala.",
  }),
  card({
    reference: "I.A.8",
    marks: "2p",
    officialText: `8. Propozitia "Majoritatea informatiilor nu este usor de verificat." este un exemplu de propozitie:
a. universala afirmativa
b. particulara negativa
c. universala negativa
d. particulara afirmativa`,
    titlu: "I.A.8 - Particulara negativa",
    raspuns_corect: "b) particulara negativa",
    de_ce_este_corect:
      "In practica logicii de examen, cuantificatori precum 'majoritatea' nu exprima totalitatea clasei, deci sunt tratati in aria particularului. Relatia dintre subiect si predicat este negativa, fiind marcata de 'nu este'. Rezulta o propozitie particulara negativa, adica de tip O extins.",
    tip_item: "Patrat logic - identificarea formei propositionale",
    regula_generala: [
      "Cand cantitatea nu acopera intreaga clasa, propozitia este tratata ca particulara.",
      "Prezenta negatiei in copula face propozitia negativa.",
      "Particular + negativ duce la forma O sau la echivalentul ei extins.",
    ],
    cum_gandesti: [
      "Stabilesc mai intai cantitatea: total sau doar o parte din clasa.",
      "Stabilesc apoi calitatea: afirmativ sau negativ.",
      "Combin cele doua trasaturi si aleg forma corespunzatoare.",
    ],
    schema_logica: {
      tip: "forma O extinsa",
      continut: ["majoritatea -> particular", "nu este -> negativ", "=> O"],
    },
    reprezentare_vizuala: [
      "Nu toata clasa informatiilor este vizata",
      "Relatia cu predicatul este negata",
    ],
    step_by_step: [
      "Citesc cuantorul: 'majoritatea'.",
      "Observ ca nu spune 'toate', deci nu am universalitate.",
      "Citesc copula negativa: 'nu este'.",
      "Rezultatul este particular-negativ.",
    ],
    de_ce_nu: {
      a: "Universala afirmativa ar cere totalitatea clasei si absenta negatiei. Aici lipsesc ambele conditii.",
      b: "Corect.",
      c: "Negativitatea este prezenta, dar universalitatea lipseste.",
      d: "Cantitatea este intr-adevar particulara, dar calitatea nu este afirmativa, ci negativa.",
    },
    capcana_frecventa:
      "Multi elevi supraevalueaza cuvantul 'majoritatea' si il trateaza ca pe 'toate'. In logica scolara, el nu exprima universalul.",
  }),
  card({
    reference: "I.A.9",
    marks: "2p",
    officialText: `9. Intensiunea termenului stilou este:
a. totalitatea stilourilor
b. instrument de scris cu cerneala si penita
c. totalitatea instrumentelor de scris
d. unealta de diferite culori, dimensiuni`,
    titlu: "I.A.9 - Intensiunea termenului stilou",
    raspuns_corect: "b) instrument de scris cu cerneala si penita",
    de_ce_este_corect:
      "Intensiunea unui termen este totalitatea notelor lui esentiale, adica acele proprietati prin care conceptul este gandit ca fiind ceea ce este. Varianta corecta reda continutul definitoriu al conceptului 'stilou', nu clasa obiectelor la care termenul se aplica.",
    tip_item: "Raport intre termeni - intensiune / extensiune",
    regula_generala: [
      "Intensiunea inseamna continut conceptual: note esentiale.",
      "Extensiunea inseamna multimea obiectelor la care termenul se aplica.",
      "Cand vezi formule de tip 'totalitatea...', testeaza daca itemul cere extensiune, nu intensiune.",
    ],
    cum_gandesti: [
      "Verific daca se cere continutul termenului sau clasa lui de aplicare.",
      "Daca se cere intensiunea, caut proprietatile esentiale ale conceptului.",
      "Elimin variantele care descriu multimi de obiecte sau note accidentale.",
    ],
    schema_logica: {
      tip: "distinctia intensiune-extensiune",
      continut: ["Int(T) = note esentiale(T)", "Ext(T) = totalitatea obiectelor(T)"],
    },
    reprezentare_vizuala: [
      "stilou -> instrument de scris",
      "stilou -> foloseste cerneala",
      "stilou -> are penita",
    ],
    step_by_step: [
      "Observ ca itemul cere intensiunea termenului.",
      "Exclud imediat variantele care incep cu 'totalitatea...', fiindca acestea trimit spre extensiune.",
      "Testez care varianta reda trasaturile definitorii ale conceptului.",
      "Aleg definitia esentiala a stiloului.",
    ],
    de_ce_nu: {
      a: "Aceasta formula exprima extensiunea termenului, adica multimea tuturor stilourilor, nu continutul lui conceptual.",
      b: "Corect.",
      c: "Aceasta exprima o extensiune mai larga, a genului 'instrumente de scris', nu intensiunea termenului 'stilou'.",
      d: "Culorile si dimensiunile sunt note accidentale, nu note esentiale definitorii.",
    },
    capcana_frecventa:
      "Cand apar variante cu 'totalitatea...', elevii trebuie sa se opreasca imediat: acela este semnul clasic al extensiunii, nu al intensiunii.",
  }),
  card({
    reference: "I.A.10",
    marks: "2p",
    officialText: `10. Propozitiei categorice "Multe nuvele istorice sunt preferate de catre elevii de gimnaziu." ii corespunde formula:
a. SaP
b. SiP
c. SeP
d. SoP`,
    titlu: "I.A.10 - Formula pentru cuantorul 'multe'",
    raspuns_corect: "b) SiP",
    de_ce_este_corect:
      "In logica de examen, cuantificatorul 'multe' nu exprima universalitatea, ci o parte a clasei subiectului, deci este tratat ca particular. Relatia este afirmativa, deoarece propozitia afirma apartenenta unor S la clasa P. Prin urmare, formula corecta este SiP.",
    tip_item: "Patrat logic - formula categorica",
    regula_generala: [
      "Cuantificatori precum 'unele', 'multe', 'majoritatea' se trateaza in aria particularului la nivelul exercitiilor BAC.",
      "Daca nu apare negatia, propozitia este afirmativa.",
      "Particular + afirmativ duce la formula I: SiP.",
    ],
    cum_gandesti: [
      "Stabilesc cantitatea pe baza cuantorului.",
      "Stabilesc calitatea pe baza prezentei sau absentei negatiei.",
      "Transform cantitatea si calitatea in formula A, E, I sau O.",
    ],
    schema_logica: {
      tip: "forma I",
      continut: ["multe -> particular", "sunt -> afirmativ", "=> SiP"],
    },
    reprezentare_vizuala: [
      "S = nuvele istorice",
      "P = preferate de elevii de gimnaziu",
      "Unele S sunt P",
    ],
    step_by_step: [
      "Citesc cuantorul: 'multe'.",
      "Il reduc la particular, nu la universal.",
      "Observ ca enuntul este afirmativ: 'sunt preferate'.",
      "Particular + afirmativ inseamna formula I.",
    ],
    de_ce_nu: {
      a: "SaP ar cere cuantor universal, de tip 'toate', ceea ce enuntul nu spune.",
      b: "Corect.",
      c: "SeP este universala negativa; enuntul nu este nici universal, nici negativ.",
      d: "SoP este particulara negativa; aici lipseste negatia.",
    },
    capcana_frecventa:
      "Elevii transforma 'multe' in universalitate doar pentru ca suna puternic. In exercitiile de tip BAC, el ramane in zona particularului.",
  }),
]

export const v6SubiectIB1 = [
  card({
    reference: "I.B.1",
    title: "I.B.1 - Diagrama Euler comuna",
    marks: "2p",
    officialText:
      "B. Se dau termenii A, B, C, D si E astfel incat termenii A si B se afla in raport de contradictie; termenul C este incrucisat simultan cu termenii A si B si se afla in raport de opozitie cu D; termenul D este in raport de incrucisare cu termenii A, B si E. Termenul E se afla in raport de incrucisare cu termenii B si D si de opozitie cu termenii A si C.\n" +
      "1. Reprezentati, prin metoda diagramelor Euler, pe o diagrama comuna, raporturile logice dintre cei cinci termeni.",
    answer:
      "A si B se deseneaza in contradictie; C se incruciseaza cu ambele, D se incruciseaza cu A, B si E, iar E ramane in opozitie cu A si C, dar in incrucisare cu B si D.",
    justification:
      "Diagrama trebuie sa respecte simultan toate relatiile date, nu fiecare relatie separat.",
    steps: [
      "Fixezi mai intai contradictia A/B, pentru ca ea stabileste scheletul universului.",
      "Asezi C in incrucisare cu A si B, dar separat de D.",
      "Plasezi D in incrucisare cu A, B si E.",
      "Plasezi E in afara lui A si C, dar cu zona comuna in B si D.",
    ],
    schema: [
      "A intersect B = 0",
      "A union B = U",
      "C intersect A != 0",
      "C intersect B != 0",
      "C intersect D = 0",
      "D intersect A != 0",
      "D intersect B != 0",
      "D intersect E != 0",
      "E intersect A = 0",
      "E intersect C = 0",
      "E intersect B != 0",
    ],
    commonTrap:
      "Daca nu incepi cu contradictia A/B, devine foarte greu sa mentii coerent toate relatiile urmatoare.",
  }),
]

const v6B2Raw = [
  ["I.B.2.a", "a) Unii E sunt C.", "F", "E si C sunt in opozitie, deci nu au elemente comune.", ["E intersect C = 0"]],
  [
    "I.B.2.b",
    "b) Toti C sunt B.",
    "F",
    "C se incruciseaza si cu A, nu este inclus total in B.",
    ["C intersect A != 0", "C intersect B != 0"],
  ],
  ["I.B.2.c", "c) Niciun B nu este C.", "F", "C se incruciseaza cu B, deci exista zona comuna.", ["B intersect C != 0"]],
  [
    "I.B.2.d",
    "d) Unii D nu sunt E.",
    "A",
    "Incrucisarea dintre D si E implica si zona a lui D din afara lui E.",
    ["D intersect E != 0", "D \\ E != 0"],
  ],
  ["I.B.2.e", "e) Niciun A nu este D.", "F", "D se incruciseaza cu A, deci unele D sunt A.", ["A intersect D != 0"]],
  ["I.B.2.f", "f) Unii A nu sunt E.", "A", "E este in opozitie cu A, deci orice A este in afara lui E.", ["A intersect E = 0"]],
  [
    "I.B.2.g",
    "g) Toti E sunt B.",
    "F",
    "E se incruciseaza cu B, dar nu este inclus total in B.",
    ["E intersect B != 0", "E \\ B != 0"],
  ],
  ["I.B.2.h", "h) Unii C sunt A.", "A", "C se incruciseaza cu A, deci exista o zona comuna.", ["C intersect A != 0"]],
]

export const v6SubiectIB2 = v6B2Raw.map(([reference, statement, answer, justification, schema]) =>
  card({
    reference,
    title: `${reference} - Verdict`,
    marks: "1p",
    officialText: statement,
    answer,
    justification,
    steps: [
      "Citesti enuntul pe diagrama deja construita la I.B.1.",
      "Verifici daca relatia este fortata sau contrazisa de pozitionarea termenilor.",
      "Abia apoi notezi A sau F.",
    ],
    schema,
    commonTrap:
      "La incrucisare trebuie sa retii doua lucruri simultan: exista zona comuna si exista zona in afara intersectiei.",
  }),
)
