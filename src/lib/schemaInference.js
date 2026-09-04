// Drafts a `templates/{templateId}` doc shape ({ schema, sectionOrder,
// themes, defaultData }) from a pasted sample `config` — used by
// CreateTemplatePage so an admin starts from a filled-in draft instead of
// hand-writing the schema from scratch. The draft is meant to be reviewed
// and hand-edited before saving (leaf field `type`/`label` guesses are
// heuristic, not authoritative) — see docs/schema-rules.md for the target
// authored shape this produces.

const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i
const URL_RE = /^https?:\/\//i

function inferLeafType(value) {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value !== 'string') return 'text'
  if (HEX_COLOR_RE.test(value)) return 'color'
  if (IMAGE_EXT_RE.test(value) || value.includes('firebasestorage.googleapis.com')) return 'image'
  if (URL_RE.test(value)) return 'url'
  if (value.length > 80 || value.includes('\n')) return 'textarea'
  return 'text'
}

function emptyValueFor(fieldSpec) {
  switch (fieldSpec.type) {
    case 'object':
      return Object.fromEntries(Object.keys(fieldSpec.fields).map((k) => [k, emptyValueFor(fieldSpec.fields[k])]))
    case 'array':
      return []
    case 'boolean':
      return false
    case 'number':
      return null
    default:
      return ''
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Infers the shape of an array's items from a sample array — either a
// record (`fields`, merged across every object item so a field only
// present on some items, e.g. an optional `image`, still gets declared —
// the reserved `hidden` flag is skipped, it's never part of authored
// `fields`, see docs/schema-rules.md) or a bare leaf value (`of`, when
// every item is a plain string/number/boolean — see schemaAdapter.js's
// `buildArrayItem`). A mix of both in the same sample array only infers
// from the object items, since a single array can't be both shapes.
function inferArraySpec(items, warnings, path) {
  const objectItems = items.filter(isPlainObject)
  const primitiveItems = items.filter((item) => !isPlainObject(item) && !Array.isArray(item))

  if (items.length === 0) {
    warnings.push(`Mảng "${path}" đang rỗng trong config mẫu — không suy ra được kiểu item, cần khai tay "fields" hoặc "of"/"emptyItem".`)
    return { fields: {}, emptyItem: {} }
  }

  if (objectItems.length === 0) {
    const of = inferLeafType(primitiveItems[0])
    return { of, emptyItem: emptyValueFor({ type: of }) }
  }

  if (primitiveItems.length > 0) {
    warnings.push(`Mảng "${path}" lẫn cả object và giá trị đơn giản — chỉ suy field từ các item dạng object, bỏ qua các item còn lại.`)
  }
  // Field order across items follows first-appearance order (the same order
  // an admin scanning the sample array top to bottom would read them in),
  // since `fields` is a plain object and insertion order is preserved.
  const fields = {}
  for (const item of objectItems) {
    for (const [key, value] of Object.entries(item)) {
      if (key === 'hidden') continue
      if (!(key in fields)) fields[key] = inferFieldSpec(key, value, warnings, `${path}[].${key}`)
    }
  }
  return {
    fields,
    fieldOrder: Object.keys(fields),
    emptyItem: Object.fromEntries(Object.keys(fields).map((k) => [k, emptyValueFor(fields[k])])),
  }
}

function inferFieldSpec(key, value, warnings, path) {
  if (Array.isArray(value)) {
    const { fields, of, emptyItem, fieldOrder } = inferArraySpec(value, warnings, path)
    return of !== undefined
      ? { type: 'array', label: key, itemLabel: key, of, emptyItem }
      : { type: 'array', label: key, itemLabel: key, fields, emptyItem, fieldOrder }
  }
  if (isPlainObject(value)) {
    // Own key order of the sample object — see docs/schema-rules.md's
    // `fieldOrder` (sibling of `fields`, kept alongside it at every nesting
    // level since a Firestore map field's key order isn't guaranteed to
    // survive the round trip, unlike this in-memory draft).
    const fields = {}
    for (const [k, v] of Object.entries(value)) {
      fields[k] = inferFieldSpec(k, v, warnings, `${path}.${k}`)
    }
    return { type: 'object', label: key, fields, fieldOrder: Object.keys(fields) }
  }
  return { type: inferLeafType(value), label: key }
}

// Seeds the template's `themes` preset map (see schemaAdapter.js's
// normalizeThemes/findColorFields and ThemeEditor.jsx) from the sample
// config's own `theme` section, e.g. `{ themePrimary: "#0284c7", themeAccent:
// "#0891b2" }` becomes `{ theme1: { label: "Theme 1", colors: { ... } } }` —
// a starting preset named after the color values already used by the pasted
// site, so the admin isn't left with an empty preset list. Only the fields
// that are actual hex colors go into the preset; a `theme` section with none
// (e.g. it only holds a `mode` flag) can't seed one, so `themes` stays empty
// and the admin adds preset(s) by hand in the reviewed JSON (theme2, theme3, ...).
function buildThemesFromConfig(config, warnings) {
  const themeSection = config.theme
  if (!isPlainObject(themeSection)) return {}

  const colorEntries = Object.entries(themeSection).filter(
    ([, value]) => typeof value === 'string' && HEX_COLOR_RE.test(value),
  )
  if (colorEntries.length === 0) {
    warnings.push(
      'Section "theme" không có field nào là mã màu hex — không tự tạo được theme mẫu, cần khai tay "themes" trong JSON ở bước 3.',
    )
    return {}
  }

  return { theme1: { label: 'Theme 1', colors: Object.fromEntries(colorEntries) } }
}

// `visible` isn't a real section — see docs/schema-rules.md §5: a live
// config centralizes every section's show/hide flag under the single map
// `config.visible.<sectionId>` instead of storing it per-section, so a
// sample config's `visible: { hero: true, stats: false }` must NOT become
// its own schema tab of boolean fields. Once every other section has been
// inferred, each of `visible`'s own keys is applied as a `fields.visible:
// boolean` on the matching section instead — that's what the editor
// actually renders as an eye icon next to the section (see
// sectionVisibility.js/SectionNav.jsx), not a field in the form body. Only
// object sections support this (an array section has no section-level
// `fields` of its own to add it to), so a key that doesn't match any
// section, or matches an array one, gets a warning instead of being
// silently dropped or producing an invalid schema.
function applyVisibleToggles(schema, visibleMap, warnings) {
  for (const sectionId of Object.keys(visibleMap)) {
    const section = schema[sectionId]
    if (!section) {
      warnings.push(`"visible.${sectionId}" không khớp section nào trong config — bỏ qua.`)
      continue
    }
    if (section.type !== 'object') {
      warnings.push(
        `"visible.${sectionId}" trỏ tới 1 array section — array section không tự có toggle ẩn/hiện, cần đổi "${sectionId}" thành object section chứa 1 field "type": "array" bên trong (xem docs/schema-rules.md mục 5).`,
      )
      continue
    }
    section.fields.visible = { type: 'boolean', label: 'Hiển thị' }
  }
}

// `config`: a parsed sample website config, e.g. `{ brand: { name, logo },
// stats: [ { value, label } ], visible: { hero: true } }`. Every top-level
// key becomes a section — sections must be object or array per the schema
// rules, so a stray top-level primitive is skipped with a warning rather
// than producing an invalid section. `visible` is handled separately (see
// applyVisibleToggles) rather than falling into this loop.
export function inferTemplateFromConfig(config) {
  const warnings = []
  const schema = {}
  const sectionOrder = []
  const visibleMap = isPlainObject(config.visible) ? config.visible : null

  for (const [sectionId, value] of Object.entries(config)) {
    if (sectionId === 'visible') continue
    if (!Array.isArray(value) && !isPlainObject(value)) {
      warnings.push(`Bỏ qua "${sectionId}": section cấp cao nhất phải là object hoặc array, không phải giá trị đơn.`)
      continue
    }
    const spec = inferFieldSpec(sectionId, value, warnings, sectionId)
    schema[sectionId] =
      spec.type === 'array'
        ? spec.of !== undefined
          ? { type: 'array', label: spec.label, itemLabel: spec.itemLabel, of: spec.of, emptyItem: spec.emptyItem }
          : {
              type: 'array',
              label: spec.label,
              itemLabel: spec.itemLabel,
              fields: spec.fields,
              emptyItem: spec.emptyItem,
              fieldOrder: spec.fieldOrder,
            }
        : { type: 'object', label: spec.label, fields: spec.fields, fieldOrder: spec.fieldOrder }
    sectionOrder.push(sectionId)
  }

  if (visibleMap) applyVisibleToggles(schema, visibleMap, warnings)

  const themes = buildThemesFromConfig(config, warnings)

  return { schema, sectionOrder, themes, defaultData: config, warnings }
}
