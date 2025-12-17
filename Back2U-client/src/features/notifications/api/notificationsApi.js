const BASE_URL = "http://localhost:5000";

const normalizeId = (doc) => ({
  ...doc,
  id:
    typeof doc._id === "object" && doc._id && "$oid" in doc._id
      ? doc._id.$oid
      : String(doc._id || doc.id || ""),
});

export async function fetchNotifications(userEmail, limit = 50) {
  const res = await fetch(
    `${BASE_URL}/notifications?userEmail=${encodeURIComponent(userEmail)}&limit=${limit}`
  );
  if (!res.ok) throw new Error("Failed to load notifications");
  const json = await res.json();
  return (json.data || []).map(normalizeId);
}

export async function markNotificationRead(notificationId) {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark notification as read");
  return true;
}

export async function markAllNotificationsRead(userEmail) {
  const res = await fetch(
    `${BASE_URL}/notifications/read-all?userEmail=${encodeURIComponent(userEmail)}`,
    { method: "PATCH" }
  );
  if (!res.ok) throw new Error("Failed to mark all as read");

  const json = await res.json();
  return json.updatedCount || 0; // ✅ return how many actually changed
}



export async function fetchUnreadCount(userEmail) {
  const res = await fetch(
    `${BASE_URL}/notifications/unread-count?userEmail=${encodeURIComponent(userEmail)}`
  );
  if (!res.ok) throw new Error("Failed to load unread count");
  const json = await res.json();
  return json.count || 0;
}