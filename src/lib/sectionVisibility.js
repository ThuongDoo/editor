// A section's own `visible` boolean field (if it declares one) is shown as
// an eye icon next to its name in SectionNav instead of as a regular field
// in the form body — see SchemaForm.jsx / SectionNav.jsx.
export function hasVisibleToggle(section) {
  return (
    section.type === 'object' && section.fields.some((f) => f.key === 'visible' && f.type === 'boolean')
  )
}
