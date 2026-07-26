const interactiveMetaByType = {
  categorical_forms: {
    title: "Vezi formele categorice în lucru",
    description:
      "Schimbi forma A, E, I sau O și urmărești simultan formula, citirea și relația dintre termeni.",
  },
  distribution_explorer: {
    title: "Verifică distribuirea termenilor pe fiecare formă",
    description:
      "Mută-te între formele categorice și vezi imediat cine este distribuit și de ce contează asta.",
  },
  opposition_square: {
    title: "Testează imediat Pătratul opoziției",
    description:
      "Pornești de la o formă și o valoare de adevăr, apoi vezi ce se transmite și ce rămâne deschis.",
  },
  pq_relation: {
    title: "Testează relația dintre p și q",
    description:
      "Selectezi operatorul și vezi cum se schimbă rezultatul pe fiecare combinație de valori.",
  },
  argument_schemes: {
    title: "Verifică schemele de inferență pe rânduri",
    description:
      "Alegi schema și vezi imediat unde rezistă argumentul și unde apare contraexemplul.",
  },
}

const interactiveBlockTypes = new Set(Object.keys(interactiveMetaByType))

function mapCalloutTone(tone) {
  if (tone === "warning") {
    return "warning"
  }

  return "info"
}

function buildFormulaVisual(formulaBlocks, sectionConfig = {}) {
  if (!formulaBlocks.length) {
    return null
  }

  return {
    kind: "formula-strip",
    layout: sectionConfig.visualLayout ?? "full",
    title: sectionConfig.visualTitle ?? "Formulele pe care trebuie să le citești direct",
    description:
      sectionConfig.visualDescription ??
      "Reții formula împreună cu sensul ei logic, nu ca pe o listă de simboluri separate.",
    items: formulaBlocks.map((block) => ({
      label: block.label,
      formula: block.expression,
      explanation: block.explanation,
    })),
  }
}

function buildExamples(exampleBlocks = []) {
  return exampleBlocks.map((block) => ({
    label: block.title ?? "Exemplu",
    prompt: block.text,
  }))
}

function buildExamNote(calloutBlock) {
  if (!calloutBlock) {
    return null
  }

  return {
    tone: mapCalloutTone(calloutBlock.tone),
    label: calloutBlock.tone === "warning" ? "Capcană de examen" : "Punct de orientare",
    title: calloutBlock.title,
    text: calloutBlock.text,
  }
}

function buildInteractive(block, sectionConfig = {}) {
  if (!block) {
    return null
  }

  const meta = interactiveMetaByType[block.type]

  return {
    type: block.type,
    title: sectionConfig.interactiveTitle ?? meta.title,
    description: sectionConfig.interactiveDescription ?? meta.description,
    block,
    variant: "embedded",
  }
}

export function createLegacyEditorialTheory(theory, config = {}) {
  const sectionOverrides = config.sections ?? {}

  return {
    meta: {
      title: config.title ?? theory.title,
      summary: config.summary ?? theory.intro,
      hideTranscript: config.hideTranscript ?? true,
    },
    chapters: theory.sections.map((section, index) => {
      const sectionConfig = sectionOverrides[section.id] ?? {}
      const blocks = Array.isArray(section.blocks) ? section.blocks : []
      const paragraphs = blocks.filter((block) => block.type === "paragraph").map((block) => block.text)
      const bulletItems = blocks.filter((block) => block.type === "bullets").flatMap((block) => block.items ?? [])
      const exampleBlocks = blocks.filter((block) => block.type === "example")
      const formulaBlocks = blocks.filter((block) => block.type === "formula")
      const calloutBlocks = blocks.filter((block) => block.type === "callout")
      const interactiveBlock = blocks.find((block) => interactiveBlockTypes.has(block.type)) ?? null
      const examNoteSource =
        calloutBlocks.find((block) => block.tone === "warning") ?? calloutBlocks[0] ?? null

      return {
        id: section.id,
        stepLabel: sectionConfig.stepLabel ?? `Capitolul ${index + 1}`,
        title: sectionConfig.title ?? section.title,
        lead: sectionConfig.lead ?? section.intro,
        paragraphs: sectionConfig.paragraphs ?? paragraphs,
        visual: sectionConfig.visual ?? buildFormulaVisual(formulaBlocks, sectionConfig),
        auxLayout: sectionConfig.auxLayout,
        copyWidth: sectionConfig.copyWidth,
        examples: sectionConfig.examples ?? buildExamples(exampleBlocks),
        takeaways: sectionConfig.takeaways ?? bulletItems,
        examNote: sectionConfig.examNote ?? buildExamNote(examNoteSource),
        supportBlocks:
          sectionConfig.supportBlocks ??
          blocks.filter((block) => {
            if (block.type === "paragraph" || block.type === "bullets" || block.type === "example") {
              return false
            }

            if (block.type === "formula") {
              return !formulaBlocks.length
            }

            if (block.type === "callout") {
              return block !== examNoteSource
            }

            if (interactiveBlockTypes.has(block.type)) {
              return block !== interactiveBlock
            }

            return true
          }),
        interactive: sectionConfig.interactive ?? buildInteractive(interactiveBlock, sectionConfig),
      }
    }),
    recapChecklist: config.recapChecklist ?? [],
  }
}
