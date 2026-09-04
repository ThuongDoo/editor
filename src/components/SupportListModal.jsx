import { useState } from "react";
import {
  SUPPORT_STATUS_LABELS,
  useWebsiteSupportRequests,
} from "../lib/support";
import Loading from "./Loading";
import Modal from "./Modal";
import SupportDetailModal from "./SupportDetailModal";

// The list itself is read-only (status is set by staff elsewhere); opening
// a ticket lets the user reply, but only while it's still open — see
// SupportDetailModal.
export default function SupportListModal({
  isOpen,
  onClose,
  websiteId,
  userId,
}) {
  const { requests, loading, error } = useWebsiteSupportRequests(
    isOpen ? websiteId : null,
    isOpen ? userId : null,
  );
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Danh sách yêu cầu hỗ trợ">
        {loading && <Loading />}
        {error && (
          <p className="form-error">Không thể tải danh sách hỗ trợ.</p>
        )}
        {!loading && !error && requests.length === 0 && (
          <p className="status-inline">Bạn chưa có yêu cầu hỗ trợ nào.</p>
        )}
        {!loading && !error && requests.length > 0 && (
          <ul className="support-list">
            {requests.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="support-list-item"
                  onClick={() => setSelectedTicket(r)}
                >
                  <div className="support-list-item-header">
                    <span className="support-list-item-title">{r.title}</span>
                    <span
                      className={`support-status support-status-${r.status}`}
                    >
                      {SUPPORT_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <span className="support-list-item-id">{r.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <SupportDetailModal
        isOpen={selectedTicket !== null}
        onClose={() => setSelectedTicket(null)}
        ticket={selectedTicket}
        userId={userId}
      />
    </>
  );
}
