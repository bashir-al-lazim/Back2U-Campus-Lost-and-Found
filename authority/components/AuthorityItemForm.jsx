import React from "react";

export default function AuthorityItemForm({
  values,
  setValues,
  submitting,
  onSubmit,
  submitLabel = "Save item",
}) {
  // Handle input changes for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Title */}
      <input
        type="text"
        name="title"
        value={values.title || ""}
        onChange={handleChange}
        placeholder="Title"
        className="w-full border border-gray-300 rounded px-3 py-2"
        required
      />

      {/* Category */}
      <select
        name="category"
        value={values.category || ""}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded px-3 py-2"
        required
      >
        <option value="">Select category</option>
        <option value="Books">Books</option>
        <option value="Electronics">Electronics</option>
        <option value="ID Card">ID Card</option>
        <option value="Clothing">Clothing</option>
        <option value="Accessories">Accessories</option>
        <option value="Others">Others</option>
      </select>

      {/* Description */}
      <textarea
        name="description"
        value={values.description || ""}
        onChange={handleChange}
        placeholder="Short description"
        className="w-full border border-gray-300 rounded px-3 py-2 min-h-[96px]"
        required
      />

      {/* Location text */}
      <input
        type="text"
        name="locationText"
        value={values.locationText || ""}
        onChange={handleChange}
        placeholder="Location text (e.g. Main gate desk)"
        className="w-full border border-gray-300 rounded px-3 py-2"
        required
      />

      {/* Photo URL – simple string, no upload */}
      <input
        type="text"
        name="photoUrl"
        value={values.photoUrl || ""}
        onChange={handleChange}
        placeholder="Photo URL (optional)"
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      {/* Internal Tag / ID */}
      <input
        type="text"
        name="internalTag"
        value={values.internalTag || ""}
        onChange={handleChange}
        placeholder="Internal tag/ID (optional, e.g. AUTH-0003)"
        className="w-full border border-gray-300 rounded px-3 py-2"
      />

      <button
        type="submit"
        disabled={submitting}
        className={`px-4 py-2 rounded border ${
          submitting
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-black text-white"
        }`}
      >
        {submitting ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}