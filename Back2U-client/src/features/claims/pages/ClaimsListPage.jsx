import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ClaimsListPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await fetch(`${API_BASE}/claims`);
        const data = await res.json();
        setClaims(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load claims", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">Claim Management – Queue</h2>

      {claims.length === 0 ? (
        <p className="text-sm text-gray-500">No claims yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>Claim ID</th>
                <th>Item ID</th>
                <th>Claimant</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c, idx) => (
                <tr key={c._id}>
                  <td>{idx + 1}</td>
                  <td className="font-mono text-xs">{c._id}</td>
                  <td className="font-mono text-xs">{c.itemId}</td>
                  <td>{c.claimantEmail}</td>
                  <td>
                    <span className="badge badge-outline">{c.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-warning"
                      onClick={() => navigate(`/dashboard/claims/${c._id}`)}
                    >
                      View / Decide
                    </button>
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

export default ClaimsListPage; 
