import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import SchemaForm from "../components/SchemaForm";
import { useAuthUser } from "../lib/auth";
import { EditorContext } from "../lib/editorContext";
import { useTemplateSchema } from "../lib/templates";
import { saveWebsiteConfig, useWebsite } from "../lib/websites";

export default function EditorPage() {
  const { websiteId } = useParams();
  const { user } = useAuthUser();
  const { website, config, loading, error } = useWebsite(websiteId);

  const {
    sections,
    themes,
    loading: schemaLoading,
    error: schemaError,
  } = useTemplateSchema(website?.templateId);

  const [draft, setDraft] = useState(null);
  // The last-saved value, used to compute dirtiness. Starts as `config` once
  // it loads and is bumped forward on every successful save — kept separate
  // from `config` (the hook's one-time fetch) so a save doesn't need to
  // re-fetch to be reflected here.
  const [baseline, setBaseline] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

  // Prefill the editable draft once, when the website's config first loads
  // (`config` only ever transitions once, null -> object, since useWebsite
  // is a one-time fetch). Setting state during render, not in an effect, is
  // the recommended way to derive/reset state from a prop-like value — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (config && baseline === null) {
    setBaseline(config);
    setDraft(config);
  }

  if (loading) return <Loading />;
  if (error) return <p className="form-error">{error.message}</p>;
  if (!website) return null;

  if (website.ownerId !== user?.uid) {
    return (
      <p className="form-error">Bạn không có quyền chỉnh sửa website này.</p>
    );
  }

  if (schemaLoading || draft === null) return <Loading />;
  if (schemaError) return <p className="form-error">{schemaError.message}</p>;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  async function handleSave() {
    setSaveState("saving");
    try {
      await saveWebsiteConfig(websiteId, draft);
      setBaseline(draft);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <EditorContext.Provider value={{ websiteId }}>
      <main className="editor-page">
        <header className="page-header">
          <div className="page-header-title">
            <span className="page-header-eyebrow">Đang chỉnh sửa</span>
            <h1>{websiteId}</h1>
          </div>
          <Link to="/">&larr; Danh sách website</Link>
        </header>

        <SchemaForm sections={sections} themes={themes} value={draft} onChange={setDraft} />

        <div className="editor-actions">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || saveState === "saving"}
          >
            {saveState === "saving" ? "Đang lưu..." : "Lưu"}
          </button>
          {saveState === "saved" && !isDirty && (
            <span className="save-status">✓ Đã lưu</span>
          )}
          {saveState === "error" && (
            <span className="form-error">Lưu thất bại, thử lại.</span>
          )}
        </div>
      </main>
    </EditorContext.Provider>
  );
}
