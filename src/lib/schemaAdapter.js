// Converts the authored template schema shape (an object map, keyed by
// section id and by field key, with array sections described by
// `itemLabel`/`emptyItem`/`fields` — see editor/README.md) into the flat
// array-of-descriptors shape SchemaForm/SchemaFields.jsx render generically
// ({ id/key, label, type: 'object'|'array'|<leaf>, fields?, item? }).
//
// Two authored shapes are accepted:
//   - enveloped: { sectionOrder: [id, ...], schema: { [id]: Section } } —
//     `sectionOrder` controls tab order, since object key order isn't
//     guaranteed to match how a template author wants sections displayed.
//   - bare: { [id]: Section } — tab order falls back to object key order.

function normalizeType(type) {
  return (type ?? 'text').toLowerCase()
}

function normalizeFieldsMap(fieldsMap = {}) {
  return Object.entries(fieldsMap).map(([key, spec]) => ({
    key,
    label: spec.label,
    type: normalizeType(spec.type),
  }))
}

function normalizeArraySpec(defaultKey, spec) {
  return {
    key: spec.key ?? defaultKey,
    label: spec.label,
    itemLabel: spec.itemLabel,
    type: 'array',
    item: {
      type: 'object',
      fields: normalizeFieldsMap(spec.fields),
      emptyItem: spec.emptyItem,
    },
  }
}

// A section is "pure array" when its own `fields` describe one repeatable
// item (not the section's own properties) — signaled by `itemLabel`/
// `emptyItem` living directly on the section, with no separate `items`
// sub-key (e.g. `stats`, vs. `services` which has both plain `fields` and a
// nested `items` array).
function isPureArraySection(section) {
  return (section.itemLabel !== undefined || section.emptyItem !== undefined) && !section.items
}

function buildSectionDescriptor(sectionId, section) {
  if (isPureArraySection(section)) {
    return {
      id: sectionId,
      label: section.label,
      itemLabel: section.itemLabel,
      type: 'array',
      item: {
        type: 'object',
        fields: normalizeFieldsMap(section.fields),
        emptyItem: section.emptyItem,
      },
    }
  }

  const fields = normalizeFieldsMap(section.fields)
  if (section.items) {
    fields.push(normalizeArraySpec('items', section.items))
  }
  return { id: sectionId, label: section.label, type: 'object', fields }
}

function unwrapSchema(raw) {
  if (raw && typeof raw.schema === 'object' && raw.schema !== null) {
    const order = Array.isArray(raw.sectionOrder) ? raw.sectionOrder : null
    return { schemaMap: raw.schema, order }
  }
  return { schemaMap: raw ?? {}, order: null }
}

export function normalizeSchema(raw) {
  const { schemaMap, order } = unwrapSchema(raw)

  // Sections not listed in sectionOrder (a stale/incomplete order array)
  // still show up, appended after the explicitly ordered ones, so nothing
  // authored gets silently dropped.
  const orderedIds = order
    ? [...order, ...Object.keys(schemaMap).filter((id) => !order.includes(id))]
    : Object.keys(schemaMap)

  return orderedIds
    .filter((sectionId) => schemaMap[sectionId])
    .map((sectionId) => buildSectionDescriptor(sectionId, schemaMap[sectionId]))
}

// Optional top-level `themes` map — named color presets a website can start
// from (see ThemeEditor.jsx): { [presetId]: { label, colors: { [colorFieldKey]:
// value } } }. Color keys are whatever the template's own color fields are
// named (see findColorFields below), not a fixed set. Site-wide, unrelated
// to any one section, so normalized separately from normalizeSchema. Absent
// in templates authored before this existed — callers get `[]`.
export function normalizeThemes(raw) {
  const themesMap = raw?.themes
  if (!themesMap || typeof themesMap !== 'object') return []

  return Object.entries(themesMap).map(([id, theme]) => ({
    id,
    label: theme.label ?? id,
    colors: theme.colors ?? {},
  }))
}

// Site-wide color fields, sourced from the schema's own dedicated `theme`
// section (e.g. its `themePrimary`/`themeAccent` fields) — these are what
// the "Chủ đề" tab's presets and pickers write to (see ThemeEditor.jsx).
// Every field on that section is treated as a color picker regardless of
// its authored `type` (a template may declare them as plain TEXT since
// that's just how it stores a hex string), keyed by whatever field keys the
// template author chose rather than a fixed set, since different templates
// name their theme colors differently.
//
// Falls back to scanning every object section for explicit `color`-type
// fields, for templates authored before a dedicated `theme` section
// existed. Only a section's own top-level fields count — colors nested
// inside an array item are per-item, not site-wide.
export function findColorFields(sections) {
  const themeSection = sections.find((s) => s.id === 'theme' && s.type === 'object')
  if (themeSection) {
    return themeSection.fields.map((f) => ({
      sectionId: themeSection.id,
      key: f.key,
      label: f.label ?? f.key,
    }))
  }

  return sections.flatMap((section) =>
    section.type === 'object'
      ? section.fields
          .filter((f) => f.type === 'color')
          .map((f) => ({ sectionId: section.id, key: f.key, label: f.label ?? f.key }))
      : [],
  )
}
