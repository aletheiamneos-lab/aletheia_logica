import rawWhyModule from "./why_module_data.json"

export const whyModuleMeta = {
  module: rawWhyModule.module,
  description: rawWhyModule.description,
  uiRules: rawWhyModule.ui_rules,
}

export const whyItems = rawWhyModule.items ?? []

const gameTagMap = {
  "patratul-logic": ["patrat_logic", "contradictie", "contrarietate"],
  "forme-categorice": ["categorice", "SaP", "SiP", "SoP"],
  "tabel-adevar": ["propozitional", "p_q", "implicatie", "modus_ponens", "modus_tollens", "echivalenta"],
}

const lessonTagMap = {
  2: ["lectia_2", "categorice", "patrat_logic"],
  3: ["lectia_3", "silogism", "patrat_logic", "distribuire"],
  4: ["lectia_4", "propozitional", "p_q", "validitate"],
}

function scoreItemForTags(item, tags) {
  const itemTags = item.tags ?? []
  return tags.reduce((score, tag) => score + Number(itemTags.includes(tag)), 0)
}

export function getWhyItemsByTags(tags = []) {
  const normalizedTags = tags.filter(Boolean)
  if (!normalizedTags.length) {
    return whyItems
  }

  return whyItems
    .map((item) => ({ item, score: scoreItemForTags(item, normalizedTags) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.item)
}

export function getWhyItemsForGame(gameId) {
  return getWhyItemsByTags(gameTagMap[gameId] ?? [])
}

export function getWhyItemsForLesson(lessonId) {
  return getWhyItemsByTags(lessonTagMap[lessonId] ?? [])
}
