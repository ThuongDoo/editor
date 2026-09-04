import { useState } from "react";
import {
  OPEN_SUPPORT_STATUSES,
  SUPPORT_STATUS_LABELS,
  addSupportMessage,
  useSupportMessages,
} from "../lib/support";
import Loading from "./Loading";
import Modal from "./Modal";

export default function SupportDetailModal({
  isOpen,
  onClose,
  ticket,
  userId,
}) {
  const { messages, loading, error, reload } = useSupportMessages(
    isOpen ? ticket?.id : null,
  );
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setReply("");
      setSendError(null);
    }
  }

  if (!ticket) return null;

  const isOpenTicket = OPEN_SUPPORT_STATUSES.includes(ticket.status);

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      await addSupportMessage(ticket.id, userId, reply);
      setReply("");
      reload();
    } catch {
      setSendError("Gửi phản hồi thất bại, thử lại.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket.title}>
      <div className="support-detail">
        <div className="support-list-item-header">
          <span className={`support-status support-status-${ticket.status}`}>
            {SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
          <span className="support-list-item-id">{ticket.id}</span>
        </div>

        <p className="support-detail-content">{ticket.content}</p>
        {ticket.images?.length > 0 && (
          <div className="support-image-grid">
            {ticket.images.map((url) => (
              <img key={url} src={url} alt="" />
            ))}
          </div>
        )}

        {loading && <Loading />}
        {error && (
          <p className="form-error">Không thể tải phản hồi.</p>
        )}

        {!loading && !error && messages.length > 0 && (
          <ul className="support-thread">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`support-message support-message-${m.authorRole}`}
              >
                <span className="support-message-author">
                  {m.authorRole === "admin" ? "Quản trị viên" : "Bạn"}
                </span>
                <p>{m.content}</p>
              </li>
            ))}
          </ul>
        )}

        {isOpenTicket ? (
          <form className="support-form" onSubmit={handleReply}>
            <label>
              Trả lời
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Vấn đề vẫn chưa được khắc phục?"
              />
            </label>
            {sendError && <span className="form-error">{sendError}</span>}
            <div className="modal-actions">
              <button type="submit" disabled={sending || !reply.trim()}>
                {sending ? "Đang gửi..." : "Gửi phản hồi"}
              </button>
            </div>
          </form>
        ) : (
          <p className="domain-warning">
            Yêu cầu này đã được đóng. Nếu vấn đề chưa được khắc phục, vui
            lòng tạo một yêu cầu hỗ trợ mới.
          </p>
        )}
      </div>
    </Modal>
  );
}
