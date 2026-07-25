import { useState } from 'react'
import { ObjectFieldGroup } from './SchemaFields'
import SectionNav from './SectionNav'

// Top-level entry: one tab per section (see editor/README.md for the
// sections/fields shape), `value` is the full website config keyed by
// section id.
export default function SchemaForm({ sections, value, onChange }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)
  const activeSection = sections.find((s) => s.id === activeId) ?? sections[0]

  return (
    <div className="schema-form">
      <SectionNav sections={sections} activeId={activeSection.id} onSelect={setActiveId} />
      <div className="schema-form-panel">
        <ObjectFieldGroup
          fields={activeSection.fields}
          value={value[activeSection.id]}
          onChange={(v) => onChange({ ...value, [activeSection.id]: v })}
        />
      </div>
    </div>
  )
}
