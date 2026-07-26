export const FLASHCARD_LEVELS = [
  {
    id: "basic",
    label: "Basic",
    description: "Fixezi notiunile de baza si definitiile esentiale.",
    badgeClassName: "bg-[#EEF7F1] text-[#24543F] border border-[#CFE5D6]",
    surfaceClassName:
      "border-[rgba(62,142,99,0.08)] bg-[linear-gradient(180deg,rgba(251,252,251,0.99),rgba(238,247,241,0.92))]",
    buttonClassName: "bg-[#3E8E63] text-white hover:bg-[#24543F]",
    accentClassName: "text-[#3E8E63]",
  },
  {
    id: "mediu",
    label: "Mediu",
    description: "Consolidezi regulile si explicatiile care cer un pas logic in plus.",
    badgeClassName: "bg-[#FFF7E3] text-[#8B6418] border border-[#EAD59B]",
    surfaceClassName:
      "border-[rgba(214,167,61,0.1)] bg-[linear-gradient(180deg,rgba(255,253,248,0.99),rgba(255,247,227,0.94))]",
    buttonClassName: "bg-[#D6A73D] text-white hover:bg-[#8B6418]",
    accentClassName: "text-[#D6A73D]",
  },
  {
    id: "avansat",
    label: "Greu",
    description: "Lucrezi pe formulari mai dense si pe capcane logice mai fine.",
    badgeClassName: "bg-[#FFF1EF] text-[#9B4B45] border border-[#F0C2BD]",
    surfaceClassName:
      "border-[rgba(217,123,115,0.1)] bg-[linear-gradient(180deg,rgba(255,252,251,0.99),rgba(255,241,239,0.94))]",
    buttonClassName: "bg-[#D97B73] text-white hover:bg-[#9B4B45]",
    accentClassName: "text-[#D97B73]",
  },
]

export const FLASHCARD_TOTAL_SLOTS = 30
export const FLASHCARDS_HOME_PATH = "/learning/module/flash-cards"

const levelMap = new Map(FLASHCARD_LEVELS.map((level) => [level.id, level]))
const slotModules = import.meta.glob("./flashcards-slots/slot_*_*.json", {
  eager: true,
  import: "default",
})

function buildSlotId(slotNumber) {
  return `slot_${slotNumber}`
}

function isSupportedSlotNumber(slotNumber) {
  return Number.isInteger(slotNumber) && slotNumber >= 1 && slotNumber <= FLASHCARD_TOTAL_SLOTS
}

function normalizeSlotPayload(payload) {
  if (Array.isArray(payload)) {
    return { cards: payload }
  }

  if (payload && typeof payload === "object") {
    return payload
  }

  return { cards: [] }
}

function parseSlotModule(filePath, payload) {
  const match = filePath.match(/slot_(\d+)_(basic|mediu|avansat)\.json$/)

  if (!match) {
    return null
  }

  const slotNumber = Number(match[1])
  const levelId = match[2]

  if (!isSupportedSlotNumber(slotNumber)) {
    return null
  }

  const slotId = buildSlotId(slotNumber)
  const data = normalizeSlotPayload(payload)

  if (!Array.isArray(data.cards) || data.cards.length < 1) {
    return null
  }

  console.log("TOTAL CARDS:", data.cards.length)

  const sourceLevelId =
    typeof data.nivel === "string" && data.nivel.trim() ? data.nivel.trim() : levelId

  const cards = data.cards
    .map((card, index) => {
      const cardLevelId =
        typeof card?.nivel === "string" && card.nivel.trim() ? card.nivel.trim() : sourceLevelId

      if (
        !card ||
        typeof card !== "object" ||
        cardLevelId !== levelId ||
        typeof card.front !== "string" ||
        typeof card.back !== "string"
      ) {
        return null
      }

      return {
        id:
          typeof card.id === "string" && card.id.trim()
            ? card.id.trim()
            : `${slotId}_card_${index + 1}`,
        nivel: cardLevelId,
        front: card.front,
        back: card.back,
        slotId,
        slotNumber,
        cardIndex: index,
        cardNumber: index + 1,
        cardKey: `${slotId}-${levelId}-${index + 1}`,
        sourceFile: filePath.split("/").at(-1) ?? filePath,
      }
    })
    .filter(Boolean)

  if (!cards.length) {
    return null
  }

  return {
    slotId,
    id: slotId,
    nivel: levelId,
    slotNumber,
    sourceFile: filePath.split("/").at(-1) ?? filePath,
    cardCount: cards.length,
    cards,
  }
}

const normalizedSlots = Object.entries(slotModules)
  .map(([filePath, payload]) => parseSlotModule(filePath, payload))
  .filter(Boolean)
  .sort((left, right) => left.slotNumber - right.slotNumber || left.nivel.localeCompare(right.nivel))

const slotsByLevel = new Map(
  FLASHCARD_LEVELS.map((level) => [
    level.id,
    new Map(
      normalizedSlots
        .filter((slot) => slot.nivel === level.id)
        .map((slot) => [slot.slotId, slot]),
    ),
  ]),
)

function getRawFlashcardSlot(levelId, slotId) {
  const levelSlots = slotsByLevel.get(levelId)
  if (!levelSlots) {
    return null
  }
  return levelSlots.get(slotId) ?? null
}

export function isFlashcardLevel(levelId) {
  return levelMap.has(levelId)
}

export function getFlashcardLevel(levelId) {
  return levelMap.get(levelId) ?? null
}

export function buildFlashcardsLevelPath(levelId) {
  return `${FLASHCARDS_HOME_PATH}/${levelId}`
}

export function buildFlashcardSlotPath(levelId, slotId) {
  return `${buildFlashcardsLevelPath(levelId)}/${slotId}`
}

export function getFlashcardSlot(levelId, slotId) {
  return getRawFlashcardSlot(levelId, slotId)
}

export function getFlashcardSlotDeck(levelId, slotId) {
  const slot = getRawFlashcardSlot(levelId, slotId)
  const slotLevel = getFlashcardLevel(levelId)

  if (!slot) {
    return null
  }

  const slotNumber = Number(String(slotId).replace("slot_", "")) || 0

  return {
    slotId,
    slotNumber,
    cardCount: slot.cards.length,
    cards: slot.cards.map((card, index) => ({
      ...card,
      levelLabel: slotLevel?.label ?? levelId,
      cardNumber: index + 1,
      cardKey: `${slotId}-${levelId}-${index + 1}`,
    })),
  }
}

export function getFlashcardSlots(levelId) {
  const level = getFlashcardLevel(levelId)

  if (!level) {
    return []
  }

  return Array.from({ length: FLASHCARD_TOTAL_SLOTS }, (_, index) => {
    const slotNumber = index + 1
    const slotId = buildSlotId(slotNumber)
    const deck = getFlashcardSlotDeck(levelId, slotId)

    return {
      slotId,
      slotNumber,
      label: `Slot ${slotNumber}`,
      available: Boolean(deck),
      path: buildFlashcardSlotPath(levelId, slotId),
      cardCount: deck?.cardCount ?? 0,
    }
  })
}

export function getAvailableFlashcardCount(levelId) {
  return getFlashcardSlots(levelId).filter((slot) => slot.available).length
}

export function formatFlashcardCount(count) {
  return `${count} ${count === 1 ? "card" : "carduri"}`
}

export function getFlashcardLevelsOverview() {
  return FLASHCARD_LEVELS.map((level) => {
    const slots = getFlashcardSlots(level.id)
    return {
      ...level,
      slots,
      availableSlots: slots.filter((slot) => slot.available).length,
      availableCards: slots.reduce((total, slot) => total + slot.cardCount, 0),
    }
  })
}

export function getAdjacentFlashcardSlots(levelId, slotId) {
  const availableSlots = getFlashcardSlots(levelId).filter((slot) => slot.available)
  const currentIndex = availableSlots.findIndex((slot) => slot.slotId === slotId)

  if (currentIndex === -1) {
    return { previous: null, next: null }
  }

  return {
    previous: availableSlots[currentIndex - 1] ?? null,
    next: availableSlots[currentIndex + 1] ?? null,
  }
}

export const flashcardsModuleStats = {
  totalLevels: FLASHCARD_LEVELS.length,
  totalSlots: FLASHCARD_LEVELS.length * FLASHCARD_TOTAL_SLOTS,
  activeCards: normalizedSlots.reduce((total, slot) => total + slot.cardCount, 0),
}
