import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";

const API = "http://localhost:5000"; // backend URL

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get Firebase token
  async function getToken() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      toast.error("Not logged in");
      throw new Error("No user");
    }

    return await user.getIdToken(true);
  }

  /* ---------------------------------------
     LOAD CATEGORIES (Admin only)
  ---------------------------------------- */
  async function loadCategories() {
    setLoading(true);
    try {
      const token = await getToken();

      const res = await axios.get(`${API}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cats = res.data?.data ?? res.data;
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      console.error("Load categories error", err);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  /* ---------------------------------------
     CREATE CATEGORY
  ---------------------------------------- */
  const handleCreate = async () => {
    if (!newCategory) return toast.warning("Enter category name");

    try {
      const token = await getToken();

      await axios.post(
        `${API}/admin/categories`,
        { name: newCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Category created");
      setNewCategory("");
      await loadCategories();
    } catch (err) {
      console.error("Create category:", err);
      toast.error(err.response?.data?.message || "Error creating");
    }
  };

  /* ---------------------------------------
     RENAME CATEGORY
  ---------------------------------------- */
  const handleRename = async () => {
    if (!selectedId || !renameValue)
      return toast.warning("Select and enter new name");

    try {
      const token = await getToken();

      await axios.put(
        `${API}/admin/categories/${selectedId}`,
        { name: renameValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Category renamed");
      setSelectedId(null);
      setRenameValue("");
      await loadCategories();
    } catch (err) {
      console.error("Rename category:", err);
      toast.error("Rename failed");
    }
  };

  /* ---------------------------------------
     DELETE CATEGORY
  ---------------------------------------- */
  const handleDelete = async (id) => {
    try {
      const token = await getToken();

      await axios.delete(`${API}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Category deleted");
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Delete category:", err);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>

      {/* Create */}
      <div className="card mb-4 p-4 bg-base-200">
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleCreate}>
            Add
          </button>
        </div>
      </div>

      {/* Rename */}
      <div className="card p-4 bg-base-200 mb-4">
        <h2 className="font-semibold mb-2">Rename</h2>
        <select
          className="select select-bordered w-full mb-2"
          value={selectedId || ""}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            className="input input-bordered flex-1"
            placeholder="New name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <button className="btn btn-warning" onClick={handleRename}>
            Rename
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card p-4 bg-base-200">
        <h2 className="font-semibold mb-2">Categories</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>{cat.name}</td>
                  <td>
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => handleDelete(cat._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2}>No categories</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
