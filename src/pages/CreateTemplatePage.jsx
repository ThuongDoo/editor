import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parseRelaxedJson, repairJsonText } from '../lib/relaxedJson'
import { inferTemplateFromConfig } from '../lib/schemaInference'
import { createTemplate, templateExists } from '../lib/templates'

// Admin-only (see ProtectedRoute's `adminOnly`, wired in App.jsx). Flow:
// paste a sample `config` -> generate a draft template (schema/sectionOrder/
// themes/defaultData) -> review/hand-edit the draft JSON directly -> confirm
// to write `templates/{templateId}`. See docs/schema-rules.md for the
// authored shape the draft follows.
export default function CreateTemplatePage() {
  const [templateId, setTemplateId] = useState('')
  const [configText, setConfigText] = useState('')
  const [generateError, setGenerateError] = useState(null)
  const [formatNotice, setFormatNotice] = useState(null)
  const [draftText, setDraftText] = useState('')
  const [warnings, setWarnings] = useState([])
  // idle | needsConfirm | saving | saved | error
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState(null)

  function resetSaveState() {
    setSaveState('idle')
    setSaveError(null)
  }

  // JSON.parse chuẩn không chấp nhận cú pháp object literal của JS (key
  // không có ngoặc kép, nháy đơn, dấu phẩy dư) — copy thẳng từ code qua sẽ
  // báo lỗi. parseRelaxedJson tự sửa các lỗi cú pháp thường gặp đó trước
  // khi parse, để dán trực tiếp từ code cũng chạy được.
  function handleFormatConfig() {
    setGenerateError(null)
    try {
      const fixed = repairJsonText(configText)
      setFormatNotice(fixed === configText ? null : 'Đã tự động sửa lỗi cú pháp JSON.')
      setConfigText(fixed)
    } catch (err) {
      setFormatNotice(null)
      setGenerateError(`Không tự sửa được cú pháp: ${err.message}`)
    }
  }

  function handleGenerate() {
    setGenerateError(null)
    setFormatNotice(null)
    let config
    try {
      config = parseRelaxedJson(configText)
    } catch {
      setGenerateError('Config dán vào không phải JSON hợp lệ — thử bấm "Format & sửa lỗi JSON" trước.')
      return
    }
    if (config === null || typeof config !== 'object' || Array.isArray(config)) {
      setGenerateError('Config phải là 1 object JSON (map các section), ví dụ { "brand": { ... } }.')
      return
    }

    const { warnings: draftWarnings, ...draft } = inferTemplateFromConfig(config)
    setDraftText(JSON.stringify(draft, null, 2))
    setWarnings(draftWarnings)
    resetSaveState()
  }

  async function handleSave() {
    const id = templateId.trim()
    if (!id) {
      setSaveError('Nhập template ID trước khi lưu.')
      return
    }

    let data
    try {
      data = parseRelaxedJson(draftText)
    } catch {
      setSaveError('JSON template (ở ô xem lại) không hợp lệ, kiểm tra lại cú pháp.')
      return
    }

    if (saveState !== 'needsConfirm') {
      const exists = await templateExists(id)
      if (exists) {
        setSaveState('needsConfirm')
        setSaveError(`Template "${id}" đã tồn tại — bấm "Xác nhận ghi đè" nếu chắc chắn muốn thay thế.`)
        return
      }
    }

    setSaveState('saving')
    setSaveError(null)
    try {
      await createTemplate(id, data)
      setSaveState('saved')
    } catch (err) {
      setSaveState('error')
      setSaveError(err.message)
    }
  }

  return (
    <main className="create-template-page">
      <header className="page-header">
        <div className="page-header-title">
          <span className="page-header-eyebrow">Admin</span>
          <h1>Tạo template mới</h1>
        </div>
        <Link to="/">&larr; Danh sách website</Link>
      </header>

      <fieldset className="field-group">
        <legend>1. Template ID</legend>
        <label className="schema-form-row">
          <span className="schema-form-label">Template ID</span>
          <input
            type="text"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value)
              resetSaveState()
            }}
            placeholder="vd: spa-clinic"
          />
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>2. Dán config mẫu</legend>
        <textarea
          className="json-input"
          rows={14}
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          placeholder={'{\n  "brand": { "name": "...", "logo": "https://..." },\n  "stats": [ { "value": "10+", "label": "Năm kinh nghiệm" } ]\n}'}
        />
        {generateError && <p className="form-error">{generateError}</p>}
        {formatNotice && <p className="form-success">{formatNotice}</p>}
        <div className="editor-actions">
          <button type="button" onClick={handleGenerate} disabled={!configText.trim()}>
            Tạo bản nháp
          </button>
          <button type="button" onClick={handleFormatConfig} disabled={!configText.trim()}>
            Format &amp; sửa lỗi JSON
          </button>
        </div>
      </fieldset>

      {draftText && (
        <fieldset className="field-group">
          <legend>3. Xem lại &amp; chỉnh sửa template</legend>
          {warnings.length > 0 && (
            <ul className="form-error">
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <textarea
            className="json-input"
            rows={22}
            value={draftText}
            onChange={(e) => {
              setDraftText(e.target.value)
              resetSaveState()
            }}
          />
          <div className="editor-actions">
            <button type="button" onClick={handleSave} disabled={saveState === 'saving'}>
              {saveState === 'saving'
                ? 'Đang lưu...'
                : saveState === 'needsConfirm'
                  ? 'Xác nhận ghi đè'
                  : 'Lưu template'}
            </button>
            {saveState === 'saved' && <span className="save-status">✓ Đã lưu</span>}
            {saveError && <span className="form-error">{saveError}</span>}
          </div>
        </fieldset>
      )}
    </main>
  )
}
