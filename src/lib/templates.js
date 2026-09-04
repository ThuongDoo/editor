import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { normalizeSchema, normalizeThemes } from "./schemaAdapter";

// Reads templates/{templateId} — `sectionOrder`, `themes`, and `schema` are
// separate top-level fields on the doc (not nested inside one field) — and
// normalizes them into the flat section list + theme preset list
// SchemaForm/SectionNav/ThemeEditor render. See editor/README.md for the
// authored shape of each.
export function useTemplateSchema(templateId) {
  const [sections, setSections] = useState(null);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!templateId) return;
    getDoc(doc(db, "templates", templateId))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          throw new Error(`Không tìm thấy template "${templateId}".`);
        }
        const data = snapshot.data();
        const raw = {
          sectionOrder: data.sectionOrder,
          themes: data.themes,
          schema: data.schema,
        };
        setSections(normalizeSchema(raw));
        setThemes(normalizeThemes(raw));
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [templateId]);

  return { sections, themes, loading, error };
}

// Used by CreateTemplatePage before writing, to warn instead of silently
// overwriting an existing templateId (there's no undo for a `setDoc`).
export async function templateExists(templateId) {
  const snapshot = await getDoc(doc(db, "templates", templateId));
  return snapshot.exists();
}

// `data` is the full authored doc shape — { schema, sectionOrder, themes,
// defaultData } — written as-is (native Firestore map/array, not a JSON
// string), same convention as the rest of `templates/{templateId}`. `setDoc`
// (not `updateDoc`) because the doc doesn't exist yet for a brand new
// template, and overwrites in place when the admin deliberately confirms
// reusing an existing templateId.
export function createTemplate(templateId, data) {
  return setDoc(doc(db, "templates", templateId), data);
}
