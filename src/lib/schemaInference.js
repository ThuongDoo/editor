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

// Merges field specs across every item of a sample array, so a field only
// present on some items (e.g. an optional `image`) still gets declared. The
// reserved `hidden` flag is skipped — the editor manages it itself, it's
// never part of authored `fields` (see docs/schema-rules.md).
function inferArrayItemFields(items, warnings, path) {
  const objectItems = items.filter(isPlainObject)
  if (items.length > 0 && objectItems.length === 0) {
    warnings.push(`Mảng "${path}" chứa giá trị đơn giản (không phải object) — chưa hỗ trợ tự sinh field, cần khai tay "fields"/"emptyItem".`)
    return {}
  }
  if (items.length === 0) {
    warnings.push(`Mảng "${path}" đang rỗng trong config mẫu — không suy ra được field, cần khai tay "fields"/"emptyItem".`)
    return {}
  }

  const fields = {}
  for (const item of objectItems) {
    for (const [key, value] of Object.entries(item)) {
      if (key === 'hidden') continue
      if (!(key in fields)) fields[key] = inferFieldSpec(key, value, warnings, `${path}[].${key}`)
    }
  }
  return fields
}

function inferFieldSpec(key, value, warnings, path) {
  if (Array.isArray(value)) {
    const fields = inferArrayItemFields(value, warnings, path)
    return {
      type: 'array',
      label: key,
      itemLabel: key,
      fields,
      emptyItem: Object.fromEntries(Object.keys(fields).map((k) => [k, emptyValueFor(fields[k])])),
    }
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
        ? { type: 'array', label: spec.label, itemLabel: spec.itemLabel, fields: spec.fields, emptyItem: spec.emptyItem }
        : { type: 'object', label: spec.label, fields: spec.fields }
    sectionOrder.push(sectionId)
  }

  return { schema, sectionOrder, themes: {}, defaultData: config, warnings }
}
