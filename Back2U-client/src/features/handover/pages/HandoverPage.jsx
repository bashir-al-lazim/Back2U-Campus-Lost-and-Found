import { useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../../app/providers/createProvider";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const HandoverPage = () => {
  const { user, role } = useContext(AuthContext);
  const location = useLocation();

  const [claimId, setClaimId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Optional: pre-fill claimId from ?claimId=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qClaimId = params.get("claimId");
    if (qClaimId) setClaimId(qClaimId);
  }, [location.search]);

  // ❗ user must be staff
  if (!user || role !== "staff") {
    return (
      <p className="text-sm text-red-500">
        You must be logged in as staff to access the handover page.
      </p>
    );
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/handover/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, otp }),
      });

      // Try to read JSON, fall back to plain text (e.g. "Claim not found")
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }

      if (!res.ok) {
        throw new Error(data.message || "Handover verification failed");
      }

      toast.success(data.message || "Handover verified and logged.");
      setClaimId("");
      setOtp("");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Handover verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Handover – OTP Verification</h2>
       
       <p className="text-sm text-gray-600 mb-4">
              Please ask the student to come during desk hours to complete the handover.
     </p>
     
      <form
        onSubmit={handleVerify}
        className="bg-base-200 rounded-lg p-4 space-y-3"
      >
        <div>
          <label className="label">
            <span className="label-text">Claim ID</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono text-xs"
            placeholder="Paste claim _id here"
            value={claimId}
            onChange={(e) => setClaimId(e.target.value)}
            required
          />
          <p className="text-[10px] text-gray-500 mt-1">
            You can copy the Claim ID from the Claim Management page.
          </p>
        </div>

        <div>
          <label className="label">
            <span className="label-text">OTP from claimant</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono tracking-widest"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            required
          />
        </div>

        <button
          className="btn btn-success w-full"
          type="submit"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify & Complete Handover"}
        </button>
      </form>
    </div>
  );
};

export default HandoverPage;