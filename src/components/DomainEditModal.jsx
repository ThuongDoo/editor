import { useState } from "react";
import {
  DOMAIN_SUFFIX,
  checkDomainAvailable,
  isReservedDomainPrefix,
  isValidDomainPrefix,
  saveWebsiteDomain,
} from "../lib/domains";
import Modal from "./Modal";

const CHECK_MESSAGES = {
  checking: null,
  available: "✓ Tên miền hợp lệ, có thể lưu.",
  taken: "✗ Tên miền này đã được sử dụng.",
  invalid: "Tên miền chỉ gồm chữ thường, số và dấu gạch ngang.",
  reserved: "✗ Tên miền này thuộc danh sách bị chặn, không thể sử dụng.",
  error: "Không thể kiểm tra tên miền, thử lại.",
};

// Add-only: a website gets exactly one domain and it's permanent once saved
// (no edit/delete in this UI), so this modal only ever opens when the
// website doesn't have a domain yet.
export default function DomainEditModal({ isOpen, onClose, websiteId, onSaved }) {
  const [prefix, setPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  // Which prefix value has been confirmed available, and what the check
  // found — save is only allowed once these agree with the current prefix.
  const [checkedPrefix, setCheckedPrefix] = useState(null);
  const [checkState, setCheckState] = useState("idle"); // idle | checking | available | taken | invalid | reserved | error

  // Reset the form each time the modal opens — it stays mounted (only
  // Modal's contents unmount) so state wouldn't otherwise reset between
  // opens. Deriving it during render (not an effect) on an isOpen
  // transition is the recommended way to reset state from a prop-like
  // value — see EditorPage's `baseline` for the same pattern, or
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setPrefix("");
      setError(null);
      setConfirmed(false);
      setCheckedPrefix(null);
      setCheckState("idle");
    }
  }

  const trimmedPrefix = prefix.trim().toLowerCase();
  const isChecked =
    checkState === "available" && checkedPrefix === trimmedPrefix;

  function handlePrefixChange(e) {
    setPrefix(e.target.value);
    setCheckState("idle");
  }

  async function handleCheck() {
    if (!isValidDomainPrefix(trimmedPrefix)) {
      setCheckState("invalid");
      return;
    }
    if (isReservedDomainPrefix(trimmedPrefix)) {
      setCheckState("reserved");
      return;
    }
    setCheckState("checking");
    setError(null);
    try {
      const available = await checkDomainAvailable(
        `${trimmedPrefix}.${DOMAIN_SUFFIX}`,
        websiteId,
      );
      setCheckedPrefix(trimmedPrefix);
      setCheckState(available ? "available" : "taken");
    } catch (err) {
      console.error("checkDomainAvailable failed:", err);
      setCheckState("error");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!trimmedPrefix) {
      setError("Vui lòng nhập tên miền.");
      return;
    }
    if (!isChecked) {
      setError("Vui lòng kiểm tra tên miền trước khi lưu.");
      return;
    }
    if (!confirmed) {
      setError("Vui lòng xác nhận bạn đã hiểu tên miền không thể thay đổi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fullDomain = `${trimmedPrefix}.${DOMAIN_SUFFIX}`;
      await saveWebsiteDomain(
        websiteId,
        { domain: fullDomain, status: "pending", notes: "" },
        true,
      );
      onSaved({
        id: websiteId,
        domain: fullDomain,
        websiteId,
        status: "pending",
        notes: "",
      });
    } catch {
      setError("Lưu tên miền thất bại, thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm tên miền">
      <form className="domain-form" onSubmit={handleSubmit}>
        <label>
          Tên miền
          <div className="domain-input-group">
            <input
              type="text"
              value={prefix}
              onChange={handlePrefixChange}
              placeholder="tên miền"
              autoFocus
            />
            <span className="domain-input-suffix">.{DOMAIN_SUFFIX}</span>
            <button
              type="button"
              className="domain-check-btn"
              onClick={handleCheck}
              disabled={checkState === "checking" || !trimmedPrefix}
            >
              {checkState === "checking" ? "Đang kiểm tra..." : "Kiểm tra"}
            </button>
          </div>
          {checkState !== "idle" && checkState !== "checking" && (
            <span
              className={
                checkState === "available" ? "form-success" : "form-error"
              }
            >
              {CHECK_MESSAGES[checkState]}
            </span>
          )}
        </label>

        <p className="domain-warning">
          ⚠️ Tên miền sau khi lưu sẽ không thể chỉnh sửa hoặc xoá. Vui lòng
          kiểm tra kỹ trước khi lưu.
        </p>

        <label className="domain-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Tôi đã hiểu và xác nhận tên miền này là chính xác.
        </label>

        {error && <span className="form-error">{error}</span>}
        <div className="modal-actions">
          <button type="submit" disabled={saving || !isChecked || !confirmed}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
