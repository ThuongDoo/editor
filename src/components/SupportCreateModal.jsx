import { useState } from "react";
import { uploadImage } from "../lib/storage";
import { createSupportRequest } from "../lib/support";
import Modal from "./Modal";

export default function SupportCreateModal({
  isOpen,
  onClose,
  websiteId,
  userId,
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset the form each time the modal opens — see DomainEditModal for why
  // this reset happens during render (on an isOpen transition) rather than
  // in an effect.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTitle("");
      setContent("");
      setImages([]);
      setConfirmOpen(false);
      setError(null);
    }
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(
        files.map((file) => uploadImage(websiteId, file)),
      );
      setImages((prev) => [...prev, ...urls]);
    } catch {
      setError("Tải ảnh thất bại, thử lại.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function handleRequestSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề hỗ trợ.");
      return;
    }
    if (!content.trim()) {
      setError("Vui lòng nhập nội dung hỗ trợ.");
      return;
    }
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createSupportRequest(websiteId, userId, { title, content, images });
      setConfirmOpen(false);
      onCreated?.();
      onClose();
    } catch {
      setError("Gửi yêu cầu hỗ trợ thất bại, thử lại.");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Tạo hỗ trợ mới">
        <form className="support-form" onSubmit={handleRequestSubmit}>
          <label>
            Tiêu đề
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mô tả ngắn gọn vấn đề..."
              maxLength={100}
              autoFocus
            />
          </label>

          <label>
            Nội dung
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Mô tả vấn đề bạn cần hỗ trợ..."
            />
          </label>

          <label>
            Hình ảnh đính kèm
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              disabled={uploading}
            />
          </label>

          {uploading && (
            <span className="status-inline">
              <span className="spinner" aria-hidden="true" />
              Đang tải ảnh lên...
            </span>
          )}

          {images.length > 0 && (
            <div className="support-image-grid">
              {images.map((url) => (
                <div key={url} className="support-image-item">
                  <img src={url} alt="" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    aria-label="Xoá ảnh"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <span className="form-error">{error}</span>}
          <div className="modal-actions">
            <button type="submit" disabled={uploading}>
              Tạo hỗ trợ
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận gửi yêu cầu"
      >
        <form onSubmit={handleConfirm} className="support-form">
          <p>Bạn có chắc chắn muốn gửi yêu cầu hỗ trợ này không?</p>
          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Huỷ
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
