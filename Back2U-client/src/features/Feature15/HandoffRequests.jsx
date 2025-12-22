import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = "http://localhost:5000";

export default function HandoffRequests({ staffEmail }) {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/feature15/requests`);
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Fetch handoff requests:", err);
      toast.error("Failed to fetch requests");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const confirmReceipt = async (id) => {
    try {
      await axios.post(`${API}/feature15/confirm/${id}`, { staffEmail });
      toast.success("Item confirmed to inventory");
      fetchRequests();
    } catch (err) {
      console.error("Confirm receipt:", err);
      toast.error("Failed to confirm receipt");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Handoff Requests</h1>
      {requests.length === 0 ? (
        <p>No handoff requests</p>
      ) : (
        <div className="space-y-2">
          {requests.map((item) => (
            <div key={item._id} className="card p-3 bg-base-200 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p>Held by: {item.heldBy}</p>
                <p>Status: {item.status}</p>
              </div>
              <button className="btn btn-primary" onClick={() => confirmReceipt(item._id)}>
                Confirm Receipt
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
