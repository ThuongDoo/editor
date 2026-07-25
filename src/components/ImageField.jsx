import { useState } from 'react'
import { useEditorContext } from '../lib/editorContext'
import { uploadImage } from '../lib/storage'

export default function ImageField({ value, onChange }) {
  const { websiteId } = useEditorContext()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(websiteId, file)
      onChange(url)
    } catch {
      setError('Tải ảnh thất bại, thử lại.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-field">
      {value && <img src={value} alt="" className="image-preview" />}
      <div className="image-field-controls">
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
        {value && !uploading && (
          <button type="button" onClick={() => onChange('')}>
            Xoá ảnh
          </button>
        )}
      </div>
      {uploading && <span className="save-status">Đang tải lên...</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
