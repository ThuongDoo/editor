import { buildDefault } from '../lib/schemaDefaults'
import FieldInput from './FieldInput'
import ImageField from './ImageField'

// Dispatches a single field spec ({ key, label, type, fields?, item? }) to
// the right control. No dot-paths: each level gets its own value slice and
// an onChange for that slice, threaded down by the container components
// below (ObjectFieldGroup, ArrayFieldList).
export function FieldRenderer({ field, value, onChange }) {
  if (field.type === 'object') {
    return (
      <ObjectFieldGroup
        fields={field.fields}
        value={value}
        onChange={onChange}
        label={field.label}
      />
    )
  }

  if (field.type === 'array') {
    return <ArrayFieldList field={field} value={value} onChange={onChange} />
  }

  if (field.type === 'image') {
    return (
      <label className="schema-form-row">
        {field.label && <span className="schema-form-label">{field.label}</span>}
        <ImageField value={value} onChange={onChange} />
      </label>
    )
  }

  return (
    <label className="schema-form-row">
      {field.label && <span className="schema-form-label">{field.label}</span>}
      <FieldInput field={field} value={value} onChange={onChange} />
    </label>
  )
}

// A fixed nested group of fields (object type, or a section's top-level
// fields). `value` defaults to `{}` so a field missing from an older
// website's config still renders with an empty control instead of crashing.
export function ObjectFieldGroup({ fields, value, onChange, label }) {
  const obj = value ?? {}

  return (
    <fieldset className="field-group">
      {label && <legend>{label}</legend>}
      {fields.map((f) => (
        <FieldRenderer
          key={f.key}
          field={f}
          value={obj[f.key]}
          onChange={(v) => onChange({ ...obj, [f.key]: v })}
        />
      ))}
    </fieldset>
  )
}

// A repeatable list of items (array type). Each item gets a reserved
// `hidden` flag alongside its declared fields — a soft-hide the live site
// is expected to respect, kept separate from deleting the item outright.
// Deliberately no reorder controls (see plan).
export function ArrayFieldList({ field, value, onChange }) {
  const items = value ?? []

  function updateItem(index, newItemValue) {
    onChange(items.map((item, i) => (i === index ? newItemValue : item)))
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
  }

  function toggleHidden(index) {
    updateItem(index, { ...items[index], hidden: !items[index]?.hidden })
  }

  function addItem() {
    onChange([...items, { ...buildDefault(field.item), hidden: false }])
  }

  return (
    <div className="array-field">
      {field.label && <p className="array-field-label">{field.label}</p>}
      {items.map((item, index) => (
        <div key={index} className={`array-item${item?.hidden ? ' is-hidden' : ''}`}>
          <div className="array-item-header">
            <span>#{index + 1}</span>
            <label className="switch-inline">
              <input
                type="checkbox"
                checked={!item?.hidden}
                onChange={() => toggleHidden(index)}
              />
              Hiển thị
            </label>
            <button type="button" onClick={() => removeItem(index)}>
              Xoá
            </button>
          </div>
          <ObjectFieldGroup
            fields={field.item.fields}
            value={item}
            onChange={(v) => updateItem(index, v)}
          />
        </div>
      ))}
      <button type="button" onClick={addItem}>
        + Thêm
      </button>
    </div>
  )
}
