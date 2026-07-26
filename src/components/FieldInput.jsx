// Renders one leaf input for a field ({ key, label, type }), switching on
// `type`. Unknown/missing types fall back to a plain text input. Container
// types (object/array) and image are handled by SchemaFields.jsx / ImageField.
export default function FieldInput({ field, value, onChange }) {
  const stringValue = value ?? ''

  switch (field.type) {
    case 'textarea':
      return (
        <textarea rows={4} value={stringValue} onChange={(e) => onChange(e.target.value)} />
      )
    case 'color':
      return (
        <div className="field-color">
          <input
            type="color"
            value={stringValue || '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            type="text"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`${field.label ?? field.key} (mã hex)`}
          />
        </div>
      )
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )
    case 'url':
      return <input type="url" value={stringValue} onChange={(e) => onChange(e.target.value)} />
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
        />
      )
    case 'text':
    default:
      return <input type="text" value={stringValue} onChange={(e) => onChange(e.target.value)} />
  }
}
