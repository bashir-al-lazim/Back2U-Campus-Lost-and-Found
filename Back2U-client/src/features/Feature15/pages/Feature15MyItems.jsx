import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../../app/providers/createProvider";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";

const API = "http://localhost:5000";

export default function Feature15MyItems() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState({});
  const [deleting, setDeleting] = useState({});

  const auth = getAuth();

  // Fetch student's peer-held items
  useEffect(() => {
  const fetchMyItems = async () => {
    if (!user?.email) return;

    try {
      const token = await auth.currentUser.getIdToken(true); // Get Firebase ID token
      const res = await axios.get(`${API}/feature15/item`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass token to backend
        },
      });
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch my items:", err);
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  fetchMyItems();
}, [user]);


  // Request handoff
  const handleHandoffRequest = async (itemId) => {
    setRequesting((prev) => ({ ...prev, [itemId]: true }));

    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await axios.post(
        `${API}/feature15/handoff-request/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setItems((prev) =>
          prev.map((item) =>
            item._id === itemId
              ? { ...item, handoffRequested: true, status: "Handoff Requested" }
              : item
          )
        );
        toast.success("Handoff requested successfully!");
      } else {
        toast.error(res.data.message || "Failed to request handoff");
      }
    } catch (err) {
      console.error("Handoff request failed:", err);
      toast.error(err.response?.data?.message || "Error requesting handoff");
    } finally {
      setRequesting((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    setDeleting((prev) => ({ ...prev, [itemId]: true }));

    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await axios.delete(`${API}/feature15/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setItems((prev) => prev.filter((item) => item._id !== itemId));
        toast.success("Item deleted successfully!");
      } else {
        toast.error(res.data.message || "Failed to delete item");
      }
    } catch (err) {
      console.error("Delete item failed:", err);
      toast.error(err.response?.data?.message || "Error deleting item");
    } finally {
      setDeleting((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  if (authLoading || loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 pt-24">
      <h1 className="text-2xl font-bold mb-4">My Peer-Held Items</h1>
      {items.length === 0 ? (
        <p>No items posted yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item._id}
              className="border p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              {item.photo && (
                <img
                  src={item.photo}
                  alt={item.title}
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              )}

              <div className="flex-1">
                <p className="font-semibold text-lg">{item.title}</p>
                <p className="text-gray-700">{item.description}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Status: {item.status} | Handoff Requested:{" "}
                  {item.handoffRequested ? "Yes" : "No"}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-2 md:mt-0">
                <button
                  disabled={item.handoffRequested || requesting[item._id]}
                  onClick={() => handleHandoffRequest(item._id)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    item.handoffRequested
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-yellow-400 hover:bg-yellow-500 text-white"
                  }`}
                >
                  {item.handoffRequested
                    ? "Handoff Requested"
                    : requesting[item._id]
                    ? "Requesting..."
                    : "Request Handoff"}
                </button>

                <button
                  disabled={deleting[item._id]}
                  onClick={() => handleDeleteItem(item._id)}
                  className={`px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white ${
                    deleting[item._id] ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {deleting[item._id] ? "Deleting..." : "Delete Item"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
