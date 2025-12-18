import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notificationsApi";
import { AuthContext } from "../../../app/providers/createProvider";
import Swal from "sweetalert2";
import { deleteNotification } from "../api/notificationsApi";


export default function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);

  const panelRef = useRef(null);
  const userEmail = user?.email;

  const unreadLabel = useMemo(() => {
    if (!unread || unread <= 0) return "";
    return unread > 99 ? "99+" : String(unread);
  }, [unread]);

  const loadUnread = async () => {
    try {
      if (!userEmail) return setUnread(0);
      const count = await fetchUnreadCount(userEmail);
      setUnread(count);
    } catch (e) {
      console.error(e);
    }
  };

  const loadList = async () => {
    try {
      if (!userEmail) return;
      setLoading(true);
      const data = await fetchNotifications(userEmail, 50);
      setList(data);
      setUnread(data.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // badge initial + polling
  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  // load list only when opening
  useEffect(() => {
    if (open) loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onRefresh = () => {
      loadUnread();
      if (open) loadList();
    };

    window.addEventListener("notifications:refresh", onRefresh);
    return () => window.removeEventListener("notifications:refresh", onRefresh);
  }, [open, userEmail]);


  const handleOpenNotification = async (n) => {
    try {
      if (!n.isRead) await markNotificationRead(n.id);
      setOpen(false);

      if (n.link) navigate(n.link);
      else toast.info("No link available for this notification");

      loadUnread();
    } catch (e) {
      console.error(e);
      toast.error("Failed to open notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (!userEmail) return;
      if (list.length === 0) return;

      const updatedCount = await markAllNotificationsRead(userEmail);

      if (updatedCount > 0) {
        setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnread(0);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotification = async (e, n) => {
    e.stopPropagation(); // so clicking delete doesn't open the notification

    const result = await Swal.fire({
      title: "Delete this notification?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteNotification(n.id, userEmail);

      // remove from UI immediately
      setList((prev) => prev.filter((x) => x.id !== n.id));

      // update unread badge immediately
      if (!n.isRead) setUnread((u) => Math.max(0, u - 1));

    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notification");
    }
  };


  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open notifications"
        className="relative inline-flex items-center justify-center h-8 w-8 translate-y-[3px]"
      >
        {/* Bigger bell (same-ish size as that old circle) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-9 h-9"
          fill={open ? "#111827" : "none"}   // fill when open
        >
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
            stroke="#111827"
            strokeWidth="1.25"              // less bold
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Overlapping unread badge */}
        {unread > 0 && (
          <span
            className="
        absolute -top-0.5 -right-0.5
        min-w-[18px] h-[18px] px-[5px]
        rounded-full bg-red-600 text-white
        text-[11px] font-bold
        flex items-center justify-center
        leading-none
      "
          >
            {unreadLabel}
          </span>
        )}
      </button>




      {open && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] z-50">
          <div className="bg-base-100 border rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">Notifications</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-xs"
                  onClick={handleMarkAllRead}
                  disabled={list.length === 0 || unread === 0}
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto">
              {loading ? (
                <div className="p-4 text-sm opacity-70">Loading…</div>
              ) : list.length === 0 ? (
                <div className="p-4 text-sm opacity-70">No notifications yet.</div>
              ) : (
                <div className="divide-y">
                  {list.map((n) => (
                    <div
                      key={n.id}
                      className={`w-full px-4 py-3 hover:bg-base-200 transition flex items-start justify-between gap-3 ${n.isRead ? "opacity-80" : "bg-yellow-50"
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenNotification(n)}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium leading-tight">
                          {n.title}
                          {!n.isRead && (
                            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 align-middle" />
                          )}
                        </div>
                        <div className="text-sm opacity-70 mt-1">{n.message}</div>
                        <div className="text-xs opacity-50 mt-2">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, n)}
                        className="
                                      text-gray-400 hover:text-red-500
                                      transition text-lg leading-none
                                      ml-2
                                    "
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        ×
                      </button>

                    </div>
                  ))}

                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t text-xs opacity-60">
              Click a notification to open.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}