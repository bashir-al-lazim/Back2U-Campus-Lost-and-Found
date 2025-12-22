import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../../app/providers/createProvider";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ClaimDetailsPage = () => {
  const { user, role } = useContext(AuthContext);
  const { id } = useParams(); // claim id from /dashboard/claims/:id
  const navigate = useNavigate();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ========== LOAD CLAIM DETAILS ==========
  useEffect(() => {
    const fetchClaim = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/claims/${id}`);
        const raw = await res.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = { message: raw };
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to load claim details");
        }

        setClaim(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to load claim details");
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id]);

  // only staff can see this page
  if (!user || role !== "staff") {
    return (
      <p className="text-sm text-red-500">
        You must be logged in as staff to view claim details.
      </p>
    );
  }

  const isPending = claim?.status === "Pending";

  // HELPER: call /claims/:id/accept or /claims/:id/reject
  const sendDecision = async (decision, rejectionReason) => {
    setActionLoading(true);
    try {
      // Choose the correct backend endpoint
      let endpoint = "";
      if (decision === "accept") {
        endpoint = `${API_BASE}/claims/${id}/accept`;
      } else {
        endpoint = `${API_BASE}/claims/${id}/reject`;
      }

      const res = await fetch(endpoint, {
        method: "PUT", // matches your backend
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rejectionReason: rejectionReason || null,
          staffEmail: user?.email || null,
        }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { message: raw };
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to update claim");
      }

      return data; // updated claim from backend
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // ========== ACCEPT ==========
  const handleAccept = async () => {
    if (!isPending) {
      toast.error("Only pending claims can be accepted.");
      return;
    }
    if (!window.confirm("Accept this claim and generate OTP?")) return;

    try {
      const updated = await sendDecision("accept");

      toast.success(updated.message || "Claim accepted.");

      setClaim((prev) => ({
        ...(updated || prev),
        status: "Accepted",
        otp: updated?.otp || prev?.otp,
      }));
    } catch (err) {
      toast.error(err.message || "Failed to accept claim");
    }
  };

  // ========== REJECT ==========
  const handleReject = async () => {
    if (!isPending) {
      toast.error("Only pending claims can be rejected.");
      return;
    }

    const reason = window.prompt("Enter a short rejection reason:");
    if (!reason) return;

    try {
      const updated = await sendDecision("reject", reason);

      toast.success(updated.message || "Claim rejected.");

      setClaim((prev) => ({
        ...(updated || prev),
        status: "Rejected",
        rejectionReason: reason,
      }));
    } catch (err) {
      toast.error(err.message || "Failed to reject claim");
    }
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  if (!claim) {
    return <p className="text-sm text-red-500">Claim not found.</p>;
  }

  return (
    <div className="w-full max-w-2xl">
      <button
        className="btn btn-ghost btn-sm mb-4"
        onClick={() => navigate("/dashboard/claims")}
      >
        ← Back to Claims
      </button>

      <div className="bg-base-200 rounded-lg p-4 space-y-2">
        <h2 className="text-2xl font-semibold mb-2">Claim Details</h2>

        <p className="text-sm">
          <span className="font-semibold">Claim ID:</span>{" "}
          <span className="font-mono text-xs">{claim._id}</span>
        </p>
        <p className="text-sm">
          <span className="font-semibold">Item ID:</span>{" "}
          <span className="font-mono text-xs">{claim.itemId}</span>
        </p>
        <p className="text-sm">
          <span className="font-semibold">Claimant:</span>{" "}
          {claim.claimantName} – {claim.claimantEmail}
        </p>
        <p className="text-sm flex items-center gap-2">
          <span className="font-semibold">Status:</span>
          <span className="badge badge-outline">{claim.status}</span>
        </p>
        <p className="text-sm">
          <span className="font-semibold">Proof (text):</span>{" "}
          {claim.proofText || <span className="italic text-gray-500">—</span>}
        </p>
        {claim.proofPhotoUrl && (
          <p className="text-sm">
            <span className="font-semibold">Proof (photo):</span>{" "}
            <a
              href={claim.proofPhotoUrl}
              target="_blank"
              rel="noreferrer"
              className="link link-primary text-xs"
            >
              View photo
            </a>
          </p>
        )}
        {claim.rejectionReason && (
          <p className="text-sm text-red-500">
            <span className="font-semibold">Rejection reason:</span>{" "}
            {claim.rejectionReason}
          </p>
        )}

        {claim.status === "Accepted" && claim.otp && (
          <div className="mt-4 p-3 border border-dashed border-gray-400 rounded">
            <p className="font-semibold text-sm mb-1">OTP for Handover</p>
            <p className="font-mono text-2xl tracking-[0.3em]">
              {claim.otp}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Share this OTP with the claimant. Use the Handover page to verify
              it at the desk.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="btn btn-success"
          onClick={handleAccept}
          disabled={!isPending || actionLoading}
        >
          {actionLoading && isPending ? "Working..." : "Accept Claim"}
        </button>
        <button
          className="btn btn-error btn-outline"
          onClick={handleReject}
          disabled={!isPending || actionLoading}
        >
          Reject Claim
        </button>
      </div>

      {claim.status === "Accepted" && (
        <button
          className="btn btn-outline btn-sm mt-3"
          onClick={() =>
            navigate(`/dashboard/handover?claimId=${claim._id}`)
          }
        >
          Go to Handover with this Claim ID
        </button>
      )}
    </div>
  );
};

export default ClaimDetailsPage;
