import { hasVisibleToggle } from '../lib/sectionVisibility'

export default function SectionNav({ sections, activeId, onSelect, isSectionVisible, onToggleVisible }) {
  return (
    <nav className="section-nav">
      {sections.map((section) => {
        const visible = isSectionVisible(section.id)
        return (
          <div className="section-nav-item" key={section.id}>
            <button
              type="button"
              className={section.id === activeId ? 'is-active' : ''}
              onClick={() => onSelect(section.id)}
            >
              {section.label ?? section.id}
            </button>
            {hasVisibleToggle(section) && (
              <input
                type="checkbox"
                className="visibility-toggle"
                checked={visible}
                onChange={() => onToggleVisible(section.id)}
                onClick={(e) => e.stopPropagation()}
                title={visible ? 'Đang hiển thị trên site — bỏ chọn để ẩn' : 'Đang ẩn khỏi site — chọn để hiện'}
                aria-label={`Hiển thị section ${section.label ?? section.id}`}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
