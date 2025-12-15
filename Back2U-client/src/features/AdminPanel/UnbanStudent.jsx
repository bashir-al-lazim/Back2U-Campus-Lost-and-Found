import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API = "http://localhost:5000";

export default function BanUnbanStudent() {
  const [studentId, setStudentId] = useState("");
  const [userData, setUserData] = useState(null);

  const search = async () => {
    if (!studentId) return toast.warning("Enter student ID");
    try {
      const res = await axios.get(`${API}/admin/student/${studentId}`);
      setUserData(res.data);
    } catch (err) {
      console.error("Search student:", err);
      toast.error("Student not found");
      setUserData(null);
    }
  };

  const toggleBan = async () => {
    if (!userData) return;
    try {
      const action = userData.banned ? "unban" : "ban";
      await axios.put(`${API}/admin/student/${action}/${studentId}`, { adminEmail: "dev@local" });
      toast.success(`Student ${action}ned successfully`);
      setUserData({ ...userData, banned: !userData.banned });
    } catch (err) {
      console.error(`${userData.banned ? "Unban" : "Ban"} error:`, err);
      toast.error(`Failed to ${userData.banned ? "unban" : "ban"} student`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ban / Unban Student</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="input input-bordered"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <button className="btn btn-primary" onClick={search}>Search</button>
      </div>

      {userData && (
        <div className="card p-4 bg-base-200 max-w-md">
          <h2 className="text-lg font-semibold">{userData.name || userData.email || "Student"}</h2>
          <p>ID: {userData.studentId || studentId}</p>
          <p>Status: {userData.banned ? "BANNED" : "Active"}</p>
          <button className={`btn ${userData.banned ? "btn-success" : "btn-error"} mt-3`} onClick={toggleBan}>
            {userData.banned ? "Unban" : "Ban"}
          </button>
        </div>
      )}
    </div>
  );
}
