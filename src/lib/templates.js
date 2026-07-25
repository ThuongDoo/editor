import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

function parseSchema(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Trường config của template không phải JSON hợp lệ.')
  }
  if (!Array.isArray(parsed.sections)) {
    throw new Error('Template chưa có sections.')
  }
  return parsed
}

// Reads templates/{templateId}.config (a JSON string, same convention as
// websites/{id}.config) -> { name, version, sections }. `sections` is what
// the editor form is generated from — see editor/README.md for the shape.
export function useTemplateSchema(templateId) {
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!templateId) return
    getDoc(doc(db, 'templates', templateId))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          throw new Error(`Không tìm thấy template "${templateId}".`)
        }
        setSchema(parseSchema(snapshot.data().config))
        setError(null)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [templateId])

  return { schema, loading, error }
}
