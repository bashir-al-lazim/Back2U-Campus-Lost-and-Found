import { useEffect, useState } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";

const API = "http://localhost:5000";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Get Firebase token (same pattern as Categories)
  const getToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Not logged in");
    }

    return await user.getIdToken(true);
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = await getToken();

        const res = await axios.get(`${API}/admin/audit-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data?.data ?? res.data;
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Load logs:", err);
        alert("Failed to load logs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Logs (latest 50)</h1>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td>{l.admin || l.userEmail || "ADMIN_USER"}</td>
                  <td>{l.action}</td>
                  <td>
                    {typeof l.details === "string"
                      ? l.details
                      : JSON.stringify(l.details)}
                  </td>
                  <td>
                    {new Date(l.timestamp || l.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4}>No logs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
