import { useState } from 'react'
import { hasVisibleToggle } from '../lib/sectionVisibility'
import { THEME_TAB_ID } from '../lib/tabs'
import { ArrayFieldList, ObjectFieldGroup } from './SchemaFields'
import SectionNav from './SectionNav'
import ThemeEditor from './ThemeEditor'

// Top-level entry: one tab per section (see editor/README.md for the
// sections/fields shape), plus an optional "Giao diện" tab when the
// template declares `themes` presets. `value` is the full website config
// keyed by section id, with theme colors under `value.theme`. Most sections
// are object-shaped (`config[id]` = object of fields); a few (e.g. `stats`)
// are declared as a bare repeatable list, so `config[id]` is an array
// directly — branch on that here rather than wrapping every section in an
// extra object layer.
export default function SchemaForm({ sections, themes, value, onChange }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const isThemeTab = activeId === THEME_TAB_ID

  // Always a real section, even on the theme tab (activeId won't match any
  // section id then, so this falls back to sections[0]) — deliberately
  // never null. React Compiler's memoization can hoist a property read like
  // `activeSection.id` out of a conditional and evaluate it unconditionally
  // for dependency tracking, so a nullable activeSection here previously
  // crashed the theme tab even though the JSX only *used* that read on the
  // non-theme branch.
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  const sectionValue = value[activeSection.id]
  const setSectionValue = (v) => onChange({ ...value, [activeSection.id]: v })

  function toggleSectionVisible(sectionId) {
    const current = value[sectionId] ?? {}
    onChange({ ...value, [sectionId]: { ...current, visible: !(current.visible ?? true) } })
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
        activeId={isThemeTab ? THEME_TAB_ID : activeSection.id}
        onSelect={setActiveId}
        isSectionVisible={(id) => value[id]?.visible ?? true}
        onToggleVisible={toggleSectionVisible}
        showThemeTab={themes.length > 0}
      />
      <div className="schema-form-panel">
        {isThemeTab ? (
          <ThemeEditor
            themes={themes}
            value={value.theme}
            onChange={(v) => onChange({ ...value, theme: v })}
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
