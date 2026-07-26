import { doc, getDoc } from "firebase/firestore";
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
