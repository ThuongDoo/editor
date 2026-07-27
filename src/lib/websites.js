import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from './firebase'

// `config` is now written as a native Firestore map (see saveWebsiteConfig)
// so it's readable/editable as a proper nested map in the Firestore
// console instead of an opaque JSON blob. Older docs still have it as a
// JSON string — read tolerates both so those sites keep loading until
// they're next saved (which upgrades them to the map form).
function parseConfig(raw) {
  if (raw == null) return {}
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('Trường config không phải JSON hợp lệ.')
  }
}

// List of websites the given uid owns, for the site picker.
export function useOwnedWebsites(uid) {
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'websites'), where('ownerId', '==', uid))
    getDocs(q)
      .then((snapshot) => {
        setWebsites(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setError(null)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [uid])

  return { websites, loading, error }
}

// One-time fetch (not live — see plan notes on why): editing needs a stable
// snapshot to work from, not one that can be overwritten mid-edit by a
// concurrent remote change.
export function useWebsite(websiteId) {
  const [website, setWebsite] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!websiteId) return
    getDoc(doc(db, 'websites', websiteId))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          throw new Error('Không tìm thấy website.')
        }
        const data = snapshot.data()
        setWebsite({ id: snapshot.id, ...data })
        setConfig(parseConfig(data.config))
        setError(null)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [websiteId])

  return { website, config, loading, error }
}

// Written as a native map, not a JSON string — see parseConfig above.
export function saveWebsiteConfig(websiteId, config) {
  return updateDoc(doc(db, 'websites', websiteId), { config })
}
