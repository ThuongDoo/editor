import FieldInput from './FieldInput'

// Site-wide color theme: pick one of the template's named presets (see
// lib/schemaAdapter.js normalizeThemes) to fill in every declared color
// field at once, or fine-tune each one individually. `colorFields` is the
// flat list of { sectionId, key, label } discovered from the template's own
// schema (schemaAdapter.findColorFields) — ordinarily every field of the
// schema's dedicated `theme` section, so `sectionId` is 'theme' for all of
// them. `value`/`onChange` are the whole website config rather than a
// scoped slice, since older templates without a dedicated `theme` section
// may still have color fields scattered across other sections.
export default function ThemeEditor({ themes, colorFields, value, onChange }) {
  function colorValue(field) {
    return value[field.sectionId]?.[field.key]
  }

  function setColor(field, newColor) {
    onChange({
      ...value,
      [field.sectionId]: { ...value[field.sectionId], [field.key]: newColor },
    })
  }

  function isPresetActive(preset) {
    const relevant = colorFields.filter((f) => preset.colors[f.key] !== undefined)
    return relevant.length > 0 && relevant.every((f) => colorValue(f) === preset.colors[f.key])
  }

  function applyPreset(preset) {
    const next = { ...value }
    for (const field of colorFields) {
      if (preset.colors[field.key] === undefined) continue
      next[field.sectionId] = { ...next[field.sectionId], [field.key]: preset.colors[field.key] }
    }
    onChange(next)
  }

  return (
    <div className="theme-editor">
      {themes.length > 0 && (
        <div className="theme-presets">
          <p className="array-field-label">Bảng màu có sẵn</p>
          <div className="theme-preset-grid">
            {themes.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`theme-preset-card${isPresetActive(preset) ? ' is-active' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                <span className="theme-preset-swatches">
                  {Object.values(preset.colors).map((c, i) => (
                    <span key={i} className="swatch" style={{ background: c }} />
                  ))}
                </span>
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <fieldset className="field-group">
        <legend>Tuỳ chỉnh màu</legend>
        {colorFields.map((f) => (
          <label key={`${f.sectionId}.${f.key}`} className="schema-form-row">
            <span className="schema-form-label">{f.label}</span>
            <FieldInput
              field={{ type: 'color', label: f.label }}
              value={colorValue(f)}
              onChange={(v) => setColor(f, v)}
            />
          </label>
        ))}
      </fieldset>
    </div>
  )
}
