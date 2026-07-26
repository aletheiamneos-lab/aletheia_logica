import examManifest from "./examManifest.json"
import { admitereTestEntries } from "./admitereTestsCatalog"
import bacExerciseCatalog from "./bacExerciseCatalog.json"

function exerciseSlug(trackSlug, variantId) {
  return `exercitiu-${trackSlug}-${variantId.replaceAll("_", "-")}`
}

function variantCode(variantLabel) {
  return variantLabel.split(" - ")[1] ?? variantLabel
}

function buildExerciseEntry(trackSlug, variant) {
  const code = variantCode(variant.variant_label)

  return {
    id: `${trackSlug}-exercise-${variant.variant_id}`,
    track: trackSlug,
    year: variant.year,
    category: "exercise",
    slug: exerciseSlug(trackSlug, variant.variant_id),
    title: `Exercitiu ${trackSlug.toUpperCase()} ${variant.year}, ${code}`,
    summary:
      "Serie oficiala de examinare integrata ca exercitiu separat, in acelasi format reutilizabil pentru toate antrenamentele.",
    status: "available",
    variantLabel: code,
    examLabel: `Examenul national de bacalaureat ${variant.year} - Logica, argumentare si comunicare`,
    source: "generated_exercise",
    variantId: variant.variant_id,
  }
}

const generatedExercisesByTrack = {
  bac: bacExerciseCatalog.variants
    .filter((variant) => !["2013_v6", "2014_v10", "2014_v4"].includes(variant.variant_id))
    .map((variant) => buildExerciseEntry("bac", variant)),
}

const staticEntriesByTrack = {
  admitere: admitereTestEntries,
}

const generatedVariantsByTrack = {
  bac: Object.fromEntries(
    bacExerciseCatalog.variants.map((variant) => [exerciseSlug("bac", variant.variant_id), variant]),
  ),
}

function sortEntries(left, right) {
  const categoryRank = {
    example: 0,
    exercise: 1,
    test: 2,
  }

  if (
    Number.isFinite(left.sortOrder) &&
    Number.isFinite(right.sortOrder) &&
    (left.category ?? "example") === (right.category ?? "example")
  ) {
    return left.sortOrder - right.sortOrder
  }

  const leftYear = Number.parseInt(left.variantLabel?.match(/\d{4}/)?.[0] ?? left.year ?? "0", 10)
  const rightYear = Number.parseInt(right.variantLabel?.match(/\d{4}/)?.[0] ?? right.year ?? "0", 10)

  if ((categoryRank[left.category ?? "example"] ?? 9) !== (categoryRank[right.category ?? "example"] ?? 9)) {
    return (categoryRank[left.category ?? "example"] ?? 9) - (categoryRank[right.category ?? "example"] ?? 9)
  }

  if (leftYear !== rightYear) {
    return (left.category ?? "example") === "exercise"
      ? leftYear - rightYear
      : rightYear - leftYear
  }

  return left.title.localeCompare(right.title, "ro")
}

export function getExamEntries(trackSlug) {
  return [
    ...examManifest.filter((entry) => entry.track === trackSlug),
    ...(staticEntriesByTrack[trackSlug] ?? []),
    ...(generatedExercisesByTrack[trackSlug] ?? []),
  ].sort(sortEntries)
}

export function getExamEntry(trackSlug, moduleSlug) {
  return (
    getExamEntries(trackSlug).find(
      (entry) => entry.slug === moduleSlug || entry.aliases?.includes(moduleSlug),
    ) ?? null
  )
}

export function getGeneratedExerciseVariant(trackSlug, moduleSlug) {
  return generatedVariantsByTrack[trackSlug]?.[moduleSlug] ?? null
}
