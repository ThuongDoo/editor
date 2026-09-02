import { useState } from "react";
import SupportCreateModal from "./SupportCreateModal";
import SupportListModal from "./SupportListModal";

export default function SupportMenu({ websiteId, userId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  return (
    <>
      {menuOpen && (
        <div
          className="support-menu-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="support-menu">
        {menuOpen && (
          <div className="support-menu-popover">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCreateOpen(true);
              }}
            >
              + Tạo hỗ trợ mới
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setListOpen(true);
              }}
            >
              📋 Xem danh sách hỗ trợ
            </button>
          </div>
        )}

        <button
          type="button"
          className="support-fab"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Hỗ trợ"
        >
          ?
        </button>
      </div>

      <SupportCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        websiteId={websiteId}
        userId={userId}
      />
      <SupportListModal
        isOpen={listOpen}
        onClose={() => setListOpen(false)}
        websiteId={websiteId}
        userId={userId}
      />
    </>
  );
}
