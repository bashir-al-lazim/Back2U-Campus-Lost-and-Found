import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { getAuth } from "firebase/auth";

const API = "http://localhost:5000";

export default function Feature15StaffRequest() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Fetch all pending handoff requests
  const fetchHandoffItems = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser.getIdToken(true);
      const res = await axios.get(`${API}/feature15/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Fetch staff requests error:", err);
      toast.error("Failed to fetch handoff requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoffItems();
  }, []);

  // Confirm receipt by staff
  const confirmReceipt = async (itemId) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      await axios.post(
        `${API}/feature15/confirm/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Item added to official inventory");

      // Remove confirmed item from the list immediately
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      console.error("Confirm receipt error:", err);
      toast.error("Failed to confirm receipt");
    }
  };

  // Reject handoff request
  const rejectRequest = async (itemId) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      await axios.post(
        `${API}/feature15/reject/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Handover request was rejected");

      // Remove rejected item from the list immediately
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      console.error("Reject request error:", err);
      toast.error("Failed to reject handoff request");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 pt-24">
      <h1 className="text-2xl font-bold mb-4">Staff Handoff Requests</h1>

      {items.length === 0 ? (
        <p>No handoff requests available.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item._id}
              className="border p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p>Student: {item.studentEmail}</p>
                <p>Status: {item.status}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => confirmReceipt(item._id)}
                >
                  Confirm Receipt
                </button>
                <button
                  className="btn btn-error"
                  onClick={() => rejectRequest(item._id)}
                >
                  Reject Handover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ToastContainer position="bottom-right" autoClose={5000} theme="light" />
    </div>
  );
}
