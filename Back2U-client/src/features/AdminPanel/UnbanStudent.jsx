import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";

const API = "http://localhost:5000";

export default function BanUnbanStudent() {
  const [query, setQuery] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [banDate, setBanDate] = useState("");

  // 🔐 Get Firebase token
  const getToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    return await user.getIdToken(true);
  };

  // 🔍 Search student by ID, email, or name
  const searchStudent = async () => {
    if (!query) return toast.warning("Enter ID, email, or name");

    setLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${API}/admin/student/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(res.data);
    } catch (err) {
      console.error("Search student:", err);
      toast.error(err.response?.data?.message || "Student not found");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 Ban / Warning
  const banStudent = async ({ permanent = false, warning = false }) => {
    if (!userData) return;

    try {
      const token = await getToken();
      const payload = { permanent, warning, adminEmail: "dev@local" };
      if (!permanent && !warning && banDate) payload.until = banDate;

      const res = await axios.put(`${API}/admin/student/ban/${userData._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(res.data.message);

      // Update local state
      setUserData({
        ...userData,
        banned: !warning ? true : userData.banned,
        bannedUntil: !warning
          ? permanent
            ? "PERMANENT"
            : banDate || userData.bannedUntil
          : userData.bannedUntil,
        warningsCount: warning ? (userData.warningsCount || 0) + 1 : userData.warningsCount || 0,
      });
    } catch (err) {
      console.error("Ban/Warning error:", err);
      toast.error(err.response?.data?.message || "Failed to ban student");
    }
  };

  // ✅ Unban
  const unbanStudent = async () => {
    if (!userData) return;
    try {
      const token = await getToken();
      await axios.put(
        `${API}/admin/student/unban/${userData._id}`,
        { adminEmail: "dev@local" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Student unbanned successfully");
      setUserData({ ...userData, banned: false, bannedUntil: null });
    } catch (err) {
      console.error("Unban error:", err);
      toast.error(err.response?.data?.message || "Failed to unban student");
    }
  };

  // Press Enter to search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") searchStudent();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Student Management</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="input input-bordered flex-1"
          placeholder="Search by ID, email, or name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button className="btn btn-primary" onClick={searchStudent} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {userData && (
        <div className="card p-4 bg-base-200 max-w-md">
          <h2 className="text-lg font-semibold">{userData.name || userData.email || "Student"}</h2>
          <p>ID: {userData.studentId || "N/A"}</p>
          <p>Email: {userData.email || "N/A"}</p>
          <p>
            Status:{" "}
            {userData.banned
              ? `BANNED (${userData.bannedUntil || "PERMANENT"})`
              : "Active"}
          </p>
          <p>Warnings: {userData.warningsCount || 0}</p>

          <div className="flex flex-col gap-2 mt-2">
            {!userData.banned && (
              <>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input input-bordered flex-1"
                    value={banDate}
                    onChange={(e) => setBanDate(e.target.value)}
                  />
                  <button
                    className="btn btn-error"
                    onClick={() => banStudent({ permanent: false })}
                  >
                    Ban Until
                  </button>
                </div>

                <button
                  className="btn btn-warning"
                  onClick={() => banStudent({ permanent: true })}
                >
                  Ban Permanently
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => banStudent({ warning: true })}
                >
                  Send Warning
                </button>
              </>
            )}

            {userData.banned && (
              <button className="btn btn-success mt-2" onClick={unbanStudent}>
                Unban Student
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
