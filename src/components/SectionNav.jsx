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
              <button
                type="button"
                className={`visibility-toggle ${visible ? 'is-visible' : 'is-hidden'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisible(section.id)
                }}
                title={visible ? 'Đang hiển thị trên site — bấm để ẩn' : 'Đang ẩn khỏi site — bấm để hiện'}
                aria-label={`${visible ? 'Ẩn' : 'Hiện'} section ${section.label ?? section.id}`}
              >
                {visible ? '👁️' : '🙈'}
              </button>
            )}
          </div>
        )
      })}
    </nav>
  )
}
