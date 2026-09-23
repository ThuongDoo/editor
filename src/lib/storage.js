import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

// Uploads under websites/{websiteId}/ so storage.rules can authorize by
// checking that website's ownerId (see editor/storage.rules).
export async function uploadImage(websiteId, file) {
  const path = `websites/${websiteId}/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

// Best-effort cleanup for images we replace or remove. Never throws — a
// missing/already-deleted object (or an external, non-Storage URL) must not
// block the caller's own flow — but logs so a permissions issue (e.g.
// storage.rules not granting delete) is visible in the console instead of
// silently leaving orphaned files.
export async function deleteImage(url) {
  if (!url) return
  try {
    await deleteObject(ref(storage, url))
  } catch (err) {
    console.error('deleteImage failed for', url, err)
  }
}
