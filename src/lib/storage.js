import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase'

// Uploads under websites/{websiteId}/ so storage.rules can authorize by
// checking that website's ownerId (see editor/storage.rules).
export async function uploadImage(websiteId, file) {
  const path = `websites/${websiteId}/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}
