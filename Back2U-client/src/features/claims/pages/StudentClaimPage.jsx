import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../../app/providers/createProvider";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const StudentClaimPage = () => {
  const { id } = useParams(); // itemId from /app/items/:id/claim
  const navigate = useNavigate();
  const { user, role } = useContext(AuthContext);

  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);

  const [proofText, setProofText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ========= LOAD ITEM DETAILS (simple way: load all and find by id) =========
  useEffect(() => {
    const loadItem = async () => {
      try {
        const res = await fetch(`${API_BASE}/items`);
        const raw = await res.text();
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = [];
        }
        const found = Array.isArray(data)
          ? data.find((it) => it._id === id)
          : null;
        setItem(found || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load item details.");
      } finally {
        setLoadingItem(false);
      }
    };

    loadItem();
  }, [id]);

  // only students can submit
  const isStudent = !!user && role === "student";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStudent) {
      toast.error("You must be logged in as a student to submit a claim.");
      navigate("/login");
      return;
    }

    const text = proofText.trim();
    const photo = photoUrl.trim();

    // ❗ EXACTLY ONE proof rule:
    if (!text && !photo) {
      toast.error("Please provide either proof text OR a photo URL.");
      return;
    }
    if (text && photo) {
      toast.error("Choose ONLY ONE proof: text OR photo, not both.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/items/${id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: id,
          claimantEmail: user.email,
          claimantName: user.displayName || user.name || null,
          proofText: text || null,
          proofPhotoUrl: photo || null,
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
        throw new Error(data.message || "Failed to submit claim");
      }

      toast.success("Claim submitted! Status: Pending.");
      setProofText("");
      setPhotoUrl("");
      navigate("/dashboard/my-claims");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isStudent) {
    return (
      <div className="min-h-[calc(100vh-16.325rem)] flex items-center justify-center">
        <p className="text-sm text-red-500">
          Please log in as a student to submit a claim.
        </p>
      </div>
    );
  }

  if (loadingItem) {
    return (
      <div className="min-h-[calc(100vh-16.325rem)] flex items-center justify-center">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[calc(100vh-16.325rem)] flex items-center justify-center">
        <p className="text-sm text-red-500">Item not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-16.325rem)] flex justify-center py-10 px-4">
      <div className="w-full max-w-xl space-y-5">
        <h1 className="text-3xl font-semibold mb-2">Submit Claim</h1>

        {/* Item summary card */}
        <div className="bg-base-200 rounded-lg p-4 space-y-1">
          <h2 className="font-semibold text-lg">{item.title}</h2>
          <p className="text-sm text-gray-700">
            {item.description || "No description."}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-semibold">Category:</span> {item.category}{" "}
            | <span className="font-semibold">Location:</span>{" "}
            {item.locationText || item.location}
          </p>
        </div>

        {/* Claim form */}
        <form
          onSubmit={handleSubmit}
          className="bg-base-200 rounded-lg p-4 space-y-4"
        >
          <div>
            <label className="label">
              <span className="label-text">Proof (short text)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="Describe something only the real owner would know..."
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">OR Photo URL (optional)</span>
            </label>
            <input
              type="url"
              className="input input-bordered w-full"
              placeholder="https://example.com/photo.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          <p className="text-[11px] text-gray-500">
            You must provide <span className="font-semibold">exactly one</span>{" "}
            proof: <span className="font-semibold">text OR photo</span>.
          </p>

          <button
            type="submit"
            className="btn btn-warning w-full"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Claim"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentClaimPage;
