import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = "http://localhost:5000/admin";

export default function ReminderPolicy() {
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch current reminder policy on mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await axios.get(`${API}/reminder-policy`);
        if (res.data.success) {
          setDays(res.data.value);
        } else {
          toast.error("Failed to load policy");
        }
      } catch (err) {
        console.error("Fetch reminder policy error:", err);
        toast.error("Failed to load policy");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  const updatePolicy = async () => {
    if (!days || isNaN(days) || days <= 0) {
      return toast.warning("Enter a valid number of days");
    }
    try {
      const res = await axios.post(`${API}/reminder-policy`, {
        days: parseInt(days),
        adminEmail: "dev@local" // can replace with actual admin email
      });
      if (res.data.success) {
        toast.success(`Reminder policy updated to ${days} days`);
      } else {
        toast.error("Failed to update policy");
      }
    } catch (err) {
      console.error("Update reminder policy error:", err);
      toast.error("Failed to update policy");
    }
  };

  if (loading) return <p>Loading policy...</p>;

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Reminder Policy</h1>
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="number"
          min="1"
          className="input input-bordered"
          value={days}
          onChange={e => setDays(e.target.value)}
        />
        <button className="btn btn-primary" onClick={updatePolicy}>
          Update
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Items will trigger unclaimed reminders after <strong>{days}</strong> day(s)
      </p>
    </div>
  );
}
