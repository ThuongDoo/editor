import FieldInput from './FieldInput'

const COLOR_FIELDS = [
  { key: 'primary', label: 'Màu chính' },
  { key: 'secondary', label: 'Màu phụ' },
  { key: 'accent', label: 'Màu nhấn' },
  { key: 'background', label: 'Nền' },
  { key: 'surface', label: 'Bề mặt' },
]

// Site-wide color theme: pick one of the template's named presets as a
// starting point (see lib/schemaAdapter.js normalizeThemes), then fine-tune
// individual colors. `value` is `config.theme` — `{ preset, colors }` — and
// stores the *resolved* color values (not just a preset id), so the live
// site can render `config.theme.colors` directly without knowing anything
// about the editor's preset list.
export default function ThemeEditor({ themes, value, onChange }) {
  const colors = value?.colors ?? {}

  function applyPreset(preset) {
    onChange({ preset: preset.id, colors: { ...preset.colors } })
  }

  function setColor(key, colorValue) {
    onChange({ ...value, colors: { ...colors, [key]: colorValue } })
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
                className={`theme-preset-card${value?.preset === preset.id ? ' is-active' : ''}`}
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
        {COLOR_FIELDS.map((f) => (
          <label key={f.key} className="schema-form-row">
            <span className="schema-form-label">{f.label}</span>
            <FieldInput
              field={{ type: 'color', label: f.label }}
              value={colors[f.key]}
              onChange={(v) => setColor(f.key, v)}
            />
          </label>
        ))}
      </fieldset>
    </div>
  )
}
