import { card } from "./modules/card"

function buildReferencePages(fileName, pageCount, labelPrefix, displayName) {
  return Array.from({ length: pageCount }, (_, index) => ({
    title: `${labelPrefix} - pagina ${index + 1}`,
    pageNumber: index + 1,
    fileName,
    displayName,
  }))
}

function buildSectionCard(variant, section) {
  return card({
    reference: section.section_title,
    marks: section.section_points,
    title: `Serie de lucru pentru ${section.section_title}`,
    prompt: `Varianta ${variant.variant_label} este integrata ca exercitiu distinct, in acelasi format reutilizabil folosit pentru toate seriile de antrenament.`,
    officialText: [
      `Subiect oficial: ${variant.subject_pdf}`,
      `Barem oficial: ${variant.has_barem ? variant.barem_pdf : "Lipsa"}`,
      `Pagini subiect: ${variant.subject_pages}`,
      `Pagini barem: ${variant.barem_pages.length}`,
    ].join("\n"),
    answer: "Structura exercitiului este integrata",
    justification:
      "Exercitiul este introdus ca serie oficiala separata, astfel incat orice modificare de aspect, formatare sau de tip de card sa poata fi aplicata uniform tuturor seriilor BAC.",
    answerBullets: [
      "Seria ramane separata de exemplele complet rezolvate.",
      "Subiectele I, II si III sunt pregatite in aceeasi structura pentru toate exercitiile.",
      "Cand completam itemii reali, fiecare punct intra in acelasi format de card.",
    ],
    steps: [
      "Pornesti din seria oficiala si verifici rapid anul si varianta.",
      "Alegi subiectul pe care vrei sa lucrezi, fara sa amesteci seriile intre ele.",
      "Pastrezi acelasi format de card, ca orice reglaj de prezentare sa se propage automat.",
    ],
    schema: [variant.variant_label, section.section_title, "format unitar pentru exercitii"],
    commonTrap:
      "Nu trata exercitiul ca pe un exemplu deja rezolvat. Aici seria este pastrata separat tocmai ca sa lucrezi pe ea in acelasi format comun.",
  })
}

export function buildExerciseModuleData(trackSlug, variant) {
  const variantCode = variant.variant_label.split(" - ")[1] ?? variant.variant_label
  const trackTitle = trackSlug === "bac" ? "BAC" : "Admitere"

  return {
    id: `${trackSlug}-exercise-${variant.variant_id}`,
    track: trackSlug,
    slug: `exercitiu-${trackSlug}-${variant.variant_id.replaceAll("_", "-")}`,
    title: `Exercitiu ${trackTitle} ${variant.year}, ${variantCode}`,
    subtitle:
      "Serie oficiala integrata ca exercitiu separat, in acelasi format reutilizabil pentru toate variantele de antrenament.",
    intro:
      "Aici vezi seria de examinare introdusa ca exercitiu. Structura este comuna pentru toate exercitiile, astfel incat orice schimbare de stil sau format sa se poata aplica unitar peste toate variantele.",
    officialPaper: {
      subjectPages: buildReferencePages(
        variant.subject_pdf,
        variant.subject_pages,
        "Subiectul oficial",
        `Seria ${variant.variant_label} - subiect`,
      ),
      baremPages: variant.has_barem
        ? buildReferencePages(
            variant.barem_pdf,
            variant.barem_pages.length,
            "Baremul oficial",
            `Seria ${variant.variant_label} - barem`,
          )
        : [],
    },
    strategyBullets: variant.work_order,
    sections: variant.sections.map((section) => ({
      id: section.section_id.toLowerCase(),
      title: section.section_title,
      points: section.section_points,
      overview:
        "Sectiunea este pregatita ca serie de exercitiu in format comun. Cand completam itemii reali, ei intra aici fara sa schimbam structura paginii.",
      cards: [buildSectionCard(variant, section)],
    })),
    checkpoints: [],
    practiceNote:
      "Toate seriile BAC integrate aici folosesc acelasi model de exercitiu. Asta inseamna ca orice modificare de aspect sau formatare se face o singura data si se propaga peste tot.",
  }
}
