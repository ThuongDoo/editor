import { useState } from 'react'
import { findColorFields } from '../lib/schemaAdapter'
import { hasVisibleToggle, isSectionVisible, setSectionVisible } from '../lib/sectionVisibility'
import { ArrayFieldList, ObjectFieldGroup } from './SchemaFields'
import SectionNav from './SectionNav'
import ThemeEditor from './ThemeEditor'

// Top-level entry: one tab per section (see editor/README.md for the
// sections/fields shape). The schema's own `theme` section (if present)
// gets special-cased to render ThemeEditor — presets from the template's
// `themes` map plus a picker per color field — instead of the generic
// object form, since its fields (e.g. themePrimary/themeAccent) are
// site-wide colors rather than ordinary text. `value` is the full website
// config keyed by section id. Most sections are object-shaped (`config[id]`
// = object of fields); a few (e.g. `stats`) are declared as a bare
// repeatable list, so `config[id]` is an array directly — branch on that
// here rather than wrapping every section in an extra object layer.
export default function SchemaForm({ sections, themes, value, onChange }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]
  const isThemeSection = activeSection.id === 'theme' && activeSection.type === 'object'
  const colorFields = findColorFields(sections)

  const sectionValue = value[activeSection.id]
  const setSectionValue = (v) => onChange({ ...value, [activeSection.id]: v })

  function toggleSectionVisible(sectionId) {
    onChange(setSectionVisible(value, sectionId, !isSectionVisible(value, sectionId)))
  }

  // The `visible` field is rendered as the nav eye icon, not again here.
  const bodyFields =
    activeSection.type === 'object' && hasVisibleToggle(activeSection)
      ? activeSection.fields.filter((f) => f.key !== 'visible')
      : activeSection.fields

  return (
    <div className="schema-form">
      <SectionNav
        sections={sections}
        activeId={activeSection.id}
        onSelect={setActiveId}
        isSectionVisible={(id) => isSectionVisible(value, id)}
        onToggleVisible={toggleSectionVisible}
      />
      <div className="schema-form-panel">
        {isThemeSection ? (
          <ThemeEditor
            themes={themes}
            colorFields={colorFields}
            value={value}
            onChange={onChange}
          />
        ) : activeSection.type === 'array' ? (
          <ArrayFieldList field={activeSection} value={sectionValue} onChange={setSectionValue} />
        ) : (
          <ObjectFieldGroup fields={bodyFields} value={sectionValue} onChange={setSectionValue} />
        )}
      </div>
    </div>
  )
}
