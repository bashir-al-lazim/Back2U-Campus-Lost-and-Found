import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";

const API = "http://localhost:5000";

export default function BanUnbanStudent() {
  const [studentId, setStudentId] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔐 Get Firebase token (ADMIN)
  const getToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast.error("Not logged in");
      throw new Error("No user");
    }

    return await user.getIdToken(true);
  };

  // 🔍 Search student
  const search = async () => {
    if (!studentId) return toast.warning("Enter student ID");

    setLoading(true);
    try {
      const token = await getToken();

      const res = await axios.get(
        `${API}/admin/student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData(res.data);
    } catch (err) {
      console.error("Search student:", err);
      toast.error("Student not found");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // 🚫 UNBAN student (backend only supports unban)
  const unbanStudent = async () => {
    if (!userData) return;

    try {
      const token = await getToken();

      await axios.put(
        `${API}/admin/student/unban/${studentId}`,
        { adminEmail: "dev@local" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Student unbanned successfully");
      setUserData({ ...userData, banned: false });
    } catch (err) {
      console.error("Unban error:", err);
      toast.error("Failed to unban student");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Unban Student</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="input input-bordered"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <button className="btn btn-primary" onClick={search} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {userData && (
        <div className="card p-4 bg-base-200 max-w-md">
          <h2 className="text-lg font-semibold">
            {userData.name || userData.email || "Student"}
          </h2>
          <p>ID: {userData.studentId}</p>
          <p>Status: {userData.banned ? "BANNED" : "Active"}</p>

          {userData.banned && (
            <button
              className="btn btn-success mt-3"
              onClick={unbanStudent}
            >
              Unban Student
            </button>
          )}
        </div>
      )}
    </div>
  );
}
