import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = "http://localhost:5000";

export default function PeerHeldItem({ studentEmail }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: "" });

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/feature15/items/${studentEmail}`);
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Fetch peer-held items:", err);
      toast.error("Failed to fetch items");
    }
  };

  useEffect(() => {
    if (studentEmail) fetchItems();
  }, [studentEmail]);

  const createItem = async () => {
    if (!form.title || !form.description) return toast.warning("Title and description required");
    try {
      await axios.post(`${API}/feature15/item`, { ...form, studentEmail });
      toast.success("Item created");
      setForm({ title: "", description: "", category: "" });
      fetchItems();
    } catch (err) {
      console.error("Create item:", err);
      toast.error("Failed to create item");
    }
  };

  const requestHandoff = async (id) => {
    try {
      await axios.post(`${API}/feature15/handoff-request/${id}`);
      toast.success("Handoff requested");
      fetchItems();
    } catch (err) {
      console.error("Request handoff:", err);
      toast.error("Failed to request handoff");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Peer-Held Items</h1>

      <div className="mb-6 max-w-md">
        <input
          className="input input-bordered mb-2 w-full"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="input input-bordered mb-2 w-full"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <textarea
          className="textarea textarea-bordered mb-2 w-full"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button className="btn btn-primary w-full" onClick={createItem}>
          Create Item
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Your Held Items</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item._id} className="card p-3 bg-base-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p>Status: {item.status}</p>
              {item.handoffRequested && <p className="text-sm text-gray-500">Handoff requested</p>}
            </div>
            {!item.handoffRequested && (
              <button className="btn btn-success" onClick={() => requestHandoff(item._id)}>
                Request Handoff
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
