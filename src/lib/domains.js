import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";

// The part after the dot is fixed platform infrastructure — only the
// subdomain label (before it) is user-editable.
export const DOMAIN_SUFFIX = "nayva.vn";

const PREFIX_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidDomainPrefix(prefix) {
  return PREFIX_PATTERN.test(prefix);
}

// Reserved for platform infrastructure (or easily confused with it) — never
// available for a user to claim as their own subdomain.
const RESERVED_PREFIXES = new Set([
  "www",
  "api",
  "admin",
  "root",
  "app",
  "mail",
  "smtp",
  "pop",
  "imap",
  "webmail",
  "autodiscover",
  "ftp",
  "ns1",
  "ns2",
  "ns3",
  "mx",
  "vpn",
  "cpanel",
  "cdn",
  "static",
  "assets",
  "media",
  "files",
  "download",
  "dashboard",
  "portal",
  "status",
  "docs",
  "help",
  "support",
  "staging",
  "dev",
  "test",
  "demo",
  "localhost",
  "thuong",
  "domanhthuong",
]);

export function isReservedDomainPrefix(prefix) {
  return RESERVED_PREFIXES.has(prefix);
}

// One domain per website. The doc id mirrors the website id so reads/writes
// are a direct getDoc/setDoc (no query/index needed), while `domain` and
// `websiteId` are still stored as fields on the document itself, per the
// `domains` collection shape.
export function useWebsiteDomain(websiteId) {
  const [domain, setDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!websiteId) return;
    getDoc(doc(db, "domains", websiteId))
      .then((snapshot) => {
        setDomain(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [websiteId]);

  return { domain, loading, error, setDomain };
}

export function saveWebsiteDomain(websiteId, { domain, status, notes }, isNew) {
  const payload = {
    domain: domain.trim(),
    websiteId,
    status: status || "pending",
    notes: notes?.trim() || "",
    updatedAt: serverTimestamp(),
  };
  if (isNew) payload.createdAt = serverTimestamp();
  return setDoc(doc(db, "domains", websiteId), payload, { merge: true });
}

// A domain is available if no *other* website already claims it — the
// current website's own existing domain doc doesn't block re-saving.
export async function checkDomainAvailable(fullDomain, websiteId) {
  const q = query(collection(db, "domains"), where("domain", "==", fullDomain));
  const snapshot = await getDocs(q);
  return snapshot.docs.every((d) => d.id === websiteId);
}
