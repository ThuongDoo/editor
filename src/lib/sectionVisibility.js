// A section's own `visible` boolean field (if it declares one) is shown as
// an eye icon next to its name in SectionNav instead of as a regular field
// in the form body — see SchemaForm.jsx / SectionNav.jsx.
export function hasVisibleToggle(section) {
  return (
    section.type === 'object' && section.fields.some((f) => f.key === 'visible' && f.type === 'boolean')
  )
}

// The eye icon's actual value/write target is a single site-wide
// `config.visible.<sectionId>` map, NOT `config[sectionId].visible` — this
// is the contract every live site (`template`'s `content.js` readers, e.g.
// `data.visible?.hero`) actually reads, and what `admin`'s createWebsite
// seeds from a template's `defaultData.visible`. Keeping both the read and
// the write here, next to each other, so the two can't drift apart again.
export function isSectionVisible(config, sectionId) {
  return config.visible?.[sectionId] ?? true
}

export function setSectionVisible(config, sectionId, visible) {
  return { ...config, visible: { ...config.visible, [sectionId]: visible } }
}
