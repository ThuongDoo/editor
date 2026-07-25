export default function SectionNav({ sections, activeId, onSelect }) {
  return (
    <nav className="section-nav">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={section.id === activeId ? 'is-active' : ''}
          onClick={() => onSelect(section.id)}
        >
          {section.label ?? section.id}
        </button>
      ))}
    </nav>
  )
}
