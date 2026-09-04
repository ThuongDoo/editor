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
  const fields = {}
  for (const item of objectItems) {
    for (const [key, value] of Object.entries(item)) {
      if (key === 'hidden') continue
      if (!(key in fields)) fields[key] = inferFieldSpec(key, value, warnings, `${path}[].${key}`)
    }
  }
  return { fields, emptyItem: Object.fromEntries(Object.keys(fields).map((k) => [k, emptyValueFor(fields[k])])) }
}

function inferFieldSpec(key, value, warnings, path) {
  if (Array.isArray(value)) {
    const { fields, of, emptyItem } = inferArraySpec(value, warnings, path)
    return of !== undefined
      ? { type: 'array', label: key, itemLabel: key, of, emptyItem }
      : { type: 'array', label: key, itemLabel: key, fields, emptyItem }
  }
  if (isPlainObject(value)) {
    const fields = {}
    for (const [k, v] of Object.entries(value)) {
      fields[k] = inferFieldSpec(k, v, warnings, `${path}.${k}`)
    }
    return { type: 'object', label: key, fields }
  }
  return { type: inferLeafType(value), label: key }
}

// `config`: a parsed sample website config, e.g. `{ brand: { name, logo },
// stats: [ { value, label } ], visible: { hero: true } }`. Every top-level
// key becomes a section — sections must be object or array per the schema
// rules, so a stray top-level primitive is skipped with a warning rather
// than producing an invalid section.
export function inferTemplateFromConfig(config) {
  const warnings = []
  const schema = {}
  const sectionOrder = []

  for (const [sectionId, value] of Object.entries(config)) {
    if (!Array.isArray(value) && !isPlainObject(value)) {
      warnings.push(`Bỏ qua "${sectionId}": section cấp cao nhất phải là object hoặc array, không phải giá trị đơn.`)
      continue
    }
    const spec = inferFieldSpec(sectionId, value, warnings, sectionId)
    schema[sectionId] =
      spec.type === 'array'
        ? spec.of !== undefined
          ? { type: 'array', label: spec.label, itemLabel: spec.itemLabel, of: spec.of, emptyItem: spec.emptyItem }
          : { type: 'array', label: spec.label, itemLabel: spec.itemLabel, fields: spec.fields, emptyItem: spec.emptyItem }
        : { type: 'object', label: spec.label, fields: spec.fields }
    sectionOrder.push(sectionId)
  }

  return { schema, sectionOrder, themes: {}, defaultData: config, warnings }
}
