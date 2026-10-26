/**
 * Bundled fallback knowledge — used ONLY when the knowledgeSources collection
 * is empty or the database is unavailable. Every note is curated general
 * guidance, explicitly labelled as non-verified. No dosages are given.
 */
export const culturalNotesByCrop: Record<string, string> = {
  tomato:
    'Keep tomato leaves dry when watering and avoid working among plants while they are wet. Remove and destroy visibly spotted leaves rather than composting them. Wider plant spacing improves airflow and slows leaf disease spread. Contact your local agricultural extension office before applying any product.',
  maize:
    'Watch for lesions on leaves and keep records of where they appear. Rotate crops where practical and remove previous-season residue from the field surface. Balanced nutrition from a real soil test helps plants tolerate stress. Contact your local agricultural extension office before applying any product.',
  wheat:
    'Rust and leaf-spot signs often spread fastest in humid spells; scout field edges early and often. Notes in a small notebook make recurring patterns easier to see later. Avoid unnecessary nitrogen if leaf disease pressure is rising. Contact your local agricultural extension office before applying any product.',
  potato:
    'Haulms should be destroyed on schedule and volunteers removed between seasons. Irrigate early in the day so foliage dries before nightfall. Store harvested tubers cool, dark, and ventilated. Contact your local agricultural extension office before applying any product.',
  rice:
    'Maintain field drainage and avoid long stagnant-water periods where possible. Leaf-yellowing patterns should be recorded with photos and reported to extension staff. Seed treatment decisions belong with certified advisory sources. Contact your local agricultural extension office before applying any product.',
  cotton:
    'Mixed stress patterns often follow irregular irrigation; keep a watering log alongside scouting notes. Avoid walking through wet fields to slow the transfer of leaf pathogens. Contact your local agricultural extension office before applying any product.',
}

export const knowledgeFallbackDocs = Object.entries(culturalNotesByCrop).map(([crop, body], index) => ({
  docId: `kb-fallback-${crop}`,
  title: `${crop.charAt(0).toUpperCase()}${crop.slice(1)} — general care basics`,
  body,
  crops: [crop],
  topics: ['general-care', crop],
  sourceNote: 'Bundled fallback knowledge (demo) — verification pending with official advisory',
  quality: 'curated-general' as const,
  order: index,
}))
