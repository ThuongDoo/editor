import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

export const SUPPORT_STATUS_LABELS = {
  pending: "Đang chờ xử lý",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  rejected: "Đã từ chối",
};

// Once a ticket lands in one of these, it's closed for good — no more
// replies. The user has to open a new ticket instead of reopening this one.
export const OPEN_SUPPORT_STATUSES = ["pending", "in_progress"];

// Only the two equality filters below are used (no orderBy) so this query
// only needs Firestore's automatic single-field indexes — adding an
// orderBy on a third field would require a manually-created composite
// index. Sorted client-side instead, which is fine at this list's size.
export function useWebsiteSupportRequests(websiteId, userId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!websiteId || !userId) return;
    const q = query(
      collection(db, "supports"),
      where("websiteId", "==", websiteId),
      where("userId", "==", userId),
    );
    getDocs(q)
      .then((snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
        );
        setRequests(docs);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [websiteId, userId]);

  return { requests, loading, error };
}

export function createSupportRequest(
  websiteId,
  userId,
  { title, content, images },
) {
  return addDoc(collection(db, "supports"), {
    websiteId,
    userId,
    title: title.trim(),
    content: content.trim(),
    images,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

// The reply thread on one ticket — admin and the ticket's owner both post
// here (see firestore.rules: writing is blocked once the ticket is closed).
export function useSupportMessages(supportId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!supportId) return;
    getDocs(collection(db, "supports", supportId, "messages"))
      .then((snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.sort(
          (a, b) =>
            (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0),
        );
        setMessages(docs);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [supportId, reloadToken]);

  return { messages, loading, error, reload: () => setReloadToken((t) => t + 1) };
}

export function addSupportMessage(supportId, userId, content) {
  return addDoc(collection(db, "supports", supportId, "messages"), {
    authorId: userId,
    authorRole: "user",
    content: content.trim(),
    createdAt: serverTimestamp(),
  });
}
