import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";
import { AuthContext } from "../../../app/providers/createProvider";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      if (!user?.email) return;
      const data = await fetchNotifications(user.email, 50);
      setList(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleOpen = async (n) => {
    try {
      if (!n.isRead) await markNotificationRead(n.id);
      if (n.link) navigate(n.link);
      else toast.info("No link available for this notification");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to open notification");
    }
  };

  const handleReadAll = async () => {
    try {
      if (!user?.email) return;
      await markAllNotificationsRead(user.email);
      toast.success("Marked all as read");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  if (loading) return <div className="p-6">Loading notifications...</div>;

  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Notifications</h2>

        <button className="btn btn-sm" onClick={handleReadAll}>
          Mark all as read
        </button>
      </div>

      {list.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {list.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border cursor-pointer ${
                n.isRead ? "bg-base-100" : "bg-yellow-50"
              }`}
              onClick={() => handleOpen(n)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{n.title}</h3>
                {!n.isRead && <span className="badge badge-warning">New</span>}
              </div>

              <p className="text-sm text-gray-600 mt-1">{n.message}</p>

              <p className="text-xs text-gray-400 mt-2">
                {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}