const BASE_URL = "http://localhost:5000";

const normalizeId = (doc) => ({
  ...doc,

  id:
    typeof doc._id === "object" && doc._id && "$oid" in doc._id
      ? doc._id.$oid
      : String(doc._id || doc.id || ""),
});

export async function fetchRecycleBin({ role, userEmail }) {
  const params = new URLSearchParams();
  params.append("role", role);
  if (userEmail) params.append("userEmail", userEmail);

  const res = await fetch(`${BASE_URL}/api/recycle-bin?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load recycle bin");

  const json = await res.json();

  return {
    entityType: json.entityType,
    data: (json.data || []).map(normalizeId), // now each doc has doc.id
  };
}

export async function restoreDeleted({ entityType, id, restoredByEmail = null }) {
  const endpoint =
    entityType === "items"
      ? `${BASE_URL}/items/${id}/restore`
      : `${BASE_URL}/lostreports/${id}/restore`;

  const res = await fetch(endpoint, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restoredBy: restoredByEmail }),
  });

  if (!res.ok) throw new Error("Failed to restore");
  return true;
}
