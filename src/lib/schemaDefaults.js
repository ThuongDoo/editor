// Empty value matching a schema field's type — used to seed a new array item
// and (implicitly, via `?? {}`/`?? []` in SchemaFields.jsx) sections missing
// from an older website's config.
export function buildDefault(field) {
  switch (field.type) {
    case 'object':
      return Object.fromEntries(field.fields.map((f) => [f.key, buildDefault(f)]))
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
