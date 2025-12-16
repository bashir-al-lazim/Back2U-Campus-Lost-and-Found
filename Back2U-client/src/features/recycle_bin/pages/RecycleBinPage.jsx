import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { fetchRecycleBin, restoreDeleted } from "../api/recycleBinApi";
import { AuthContext } from "../../../app/providers/createProvider";

export default function RecycleBinPage() {
  const [binItems, setBinItems] = useState([]);
  const [entityType, setEntityType] = useState(""); // "items" or "lostreports"
  const [loading, setLoading] = useState(true);

  const { user, role } = useContext(AuthContext);

  const loadBin = async () => {
    try {
      setLoading(true);

      // ✅ role-based query:
      // staff/admin -> deleted items
      // student -> deleted lost reports for that student
      const result = await fetchRecycleBin({
        role,
        userEmail: user?.email,
      });

      setEntityType(result.entityType);
      setBinItems(result.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recycle bin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // wait until auth loads user + role
    if (!role) return;
    if (role === "student" && !user?.email) return;

    loadBin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.email]);

  const handleRestore = async (doc) => {
    const result = await Swal.fire({
      title: "Restore this record?",
      text: "This will bring it back into the system.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, restore",
    });

    if (!result.isConfirmed) return;

    try {
      await restoreDeleted({
        entityType,
        id: doc.id, //  use normalized string id (NOT doc._id)
        restoredByEmail: user?.email,
      });

      toast.success("Restored successfully!");
      loadBin();
    } catch (err) {
      console.error(err);
      toast.error("Restore failed");
    }
  };

  if (loading) {
    return <div className="p-6">Loading recycle bin...</div>;
  }

  return (
    <div className="w-full p-6">
      <h2 className="text-2xl font-semibold mb-4">Recycle Bin</h2>

      {binItems.length === 0 ? (
        <p className="text-gray-500">Recycle bin is empty.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title/Name</th>
                <th>Deleted At</th>
                <th>Deleted By</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {binItems.map((doc) => (
                <tr key={doc.id}>
                  <td className="capitalize">{entityType}</td>
                  <td>{doc.displayName || "(no title)"}</td>
                  <td>
                    {doc.deletedAt ? new Date(doc.deletedAt).toLocaleString() : "-"}
                  </td>
                  <td>{doc.deletedBy || "-"}</td>

                  <td>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleRestore(doc)}
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-xs text-gray-500 mt-3">
            Note: Deleted records are permanently removed after 30 days.
          </p>
        </div>
      )}
    </div>
  );
}