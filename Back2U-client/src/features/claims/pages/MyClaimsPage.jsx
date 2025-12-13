import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../app/providers/createProvider";
import { toast } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MyClaimsPage = () => {
  const { user, role } = useContext(AuthContext);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchClaims = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/claims?email=${encodeURIComponent(user.email)}`
        );
        const data = await res.json();
        setClaims(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load claims", err);
        toast.error("Could not load your claims.");
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [user]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this claim?")) return;
    setCancellingId(id);

    try {
      const res = await fetch(`${API_BASE}/claims/${id}/cancel`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data === "string" ? data : data.message || "Cancel failed");
      }

      toast.success("Claim canceled.");
      setClaims((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "Canceled" } : c))
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not cancel claim.");
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return <p className="text-sm text-red-500">You must be logged in to view your claims.</p>;
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">My Claims</h2>

      {role !== "student" && (
        <p className="text-xs text-gray-500 mb-2">
          (You are signed in as <span className="font-semibold">{role}</span>, but this page is
          designed for students.)
        </p>
      )}

      {loading ? (
        <div className="w-full flex justify-center">
          <span className="loading loading-bars loading-lg"></span>
        </div>
      ) : claims.length === 0 ? (
        <p className="text-sm text-gray-500">You have not submitted any claims yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>Item ID</th>
                <th>Status</th>
                <th>Proof</th>
                <th>OTP</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c, idx) => (
                <tr key={c._id}>
                  <td>{idx + 1}</td>
                  <td className="font-mono text-xs">{c.itemId}</td>
                  <td>
                    <span className="badge badge-outline">{c.status}</span>
                  </td>
                  <td className="max-w-xs text-xs">
                    {c.proofText
                      ? c.proofText
                      : c.proofPhotoUrl
                      ? "Photo uploaded"
                      : "-"}
                  </td>
                  <td>
                    {c.status === "Accepted" && c.otp ? (
                      <span className="font-mono text-sm">{c.otp}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {c.status === "Pending" ? (
                      <button
                        className="btn btn-xs btn-outline btn-error"
                        disabled={cancellingId === c._id}
                        onClick={() => handleCancel(c._id)}
                      >
                        {cancellingId === c._id ? "Canceling..." : "Cancel"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyClaimsPage;
