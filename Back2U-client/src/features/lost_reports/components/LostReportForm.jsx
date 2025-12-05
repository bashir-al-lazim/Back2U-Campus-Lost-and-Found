import React, { useState } from "react";
import { uploadLostReportFile } from "../../../app/lib/uploadStorage";

export default function LostReportForm({
  values,
  setValues,
  submitting,
  onSubmit,
  submitLabel = "Submit Report",
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle input changes for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      const url = await uploadLostReportFile(file, setUploadProgress);
      setValues((prev) => ({
        ...prev,
        attachmentUrl: url,
      }));
    } catch (err) {
      console.error("Upload failed:", err);
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          name="title"
          value={values.title || ""}
          onChange={handleChange}
          placeholder="E.g., Black backpack"
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category *</label>
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
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description *</label>
        <textarea
          name="description"
          value={values.description || ""}
          onChange={handleChange}
          placeholder="Describe the item you lost"
          className="w-full border border-gray-300 rounded px-3 py-2 min-h-[96px]"
          required
        />
      </div>

      {/* Location Lost */}
      <div>
        <label className="block text-sm font-medium mb-1">Where did you lose it? *</label>
        <input
          type="text"
          name="locationLost"
          value={values.locationLost || ""}
          onChange={handleChange}
          placeholder="E.g., Library 3rd floor"
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>

      {/* Date Lost */}
      <div>
        <label className="block text-sm font-medium mb-1">When did you lose it? *</label>
        <input
          type="date"
          name="dateLost"
          value={values.dateLost || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Attachment (Photo/Document - Optional)
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileUpload}
          disabled={uploading || submitting}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        {uploading && (
          <div className="mt-2">
            <div className="text-sm text-gray-600">Uploading... {uploadProgress}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        {values.attachmentUrl && !uploading && (
          <div className="mt-2 text-sm text-green-600">
            ✓ File uploaded successfully
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className={`px-4 py-2 rounded border ${
          submitting || uploading
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-black text-white"
        }`}
      >
        {submitting ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}
