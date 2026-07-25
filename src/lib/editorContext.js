import { createContext, useContext } from 'react'

// Carries the current websiteId down to deeply nested fields (ImageField
// needs it to build a Storage path) without prop-drilling through every
// recursive form layer.
export const EditorContext = createContext({ websiteId: null })

export function useEditorContext() {
  return useContext(EditorContext)
}
