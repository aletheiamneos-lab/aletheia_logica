const reportDataExample = {
  candidateName: "Alexandru Popescu",
  testTitle: "Test grilă - Model 3",
  date: "18 mai 2025",
  totalQuestions: 20,
  score: 15,
  percentage: 75,
  performanceLabel: "Bun",
  duration: "00:28:47",
  radar: [
    { axis: "Logică", value: 80 },
    { axis: "Atenție", value: 70 },
    { axis: "Calcul", value: 60 },
    { axis: "Limbaj", value: 65 },
    { axis: "Cultură", value: 55 },
  ],
  questions: [
    {
      number: 1,
      text: "Care este capitala Franței?",
      options: {
        A: "Madrid",
        B: "Berlin",
        C: "Paris",
        D: "Roma",
      },
      selected: "C",
      correct: "C",
      explanation: null,
    },
    {
      number: 2,
      text: "Care este rezultatul expresiei 15 - 7 x 2?",
      options: {
        A: "1",
        B: "16",
        C: "29",
        D: "22",
      },
      selected: "D",
      correct: "A",
      explanation: "Ordinea operațiilor se aplică înaintea scăderii: 7 x 2 = 14, apoi 15 - 14 = 1.",
    },
    {
      number: 3,
      text: "Care dintre următoarele limbaje este folosit pentru dezvoltare web front-end?",
      options: {
        A: "Python",
        B: "Java",
        C: "C++",
        D: "JavaScript",
      },
      selected: "D",
      correct: "D",
      explanation: null,
    },
    {
      number: 4,
      text: "În ce an a avut loc Marea Unire a României?",
      options: {
        A: "1916",
        B: "1918",
        C: "1945",
        D: "1920",
      },
      selected: "C",
      correct: "B",
      explanation: "Marea Unire a avut loc la 1 Decembrie 1918.",
    },
  ],
}

export default reportDataExample
