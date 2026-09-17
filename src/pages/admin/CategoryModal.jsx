import React from "react";
import { FiX, FiUploadCloud, FiRefreshCw } from "react-icons/fi";

const CategoryModal = ({
  open = false,
  mode = "add",
  formData = { name: "", image: null, imagePreview: "" },
  setFormData,
  saving = false,
  onClose,
  onSubmit,
  onImageChange,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "add" ? "Add Category" : "Edit Category"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage main product category
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <FiX className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Name
            </label>

            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="e.g., Women"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category Image
            </label>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <FiUploadCloud className="text-2xl text-gray-400 mb-2" />
              <span className="text-xs text-gray-500">
                Click to upload image
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => onImageChange(e, "category")}
                className="hidden"
              />
            </label>

            {formData.imagePreview && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border"
                />

                <div className="text-xs text-gray-600 truncate">
                  {formData.image ? formData.image.name : "Current image"}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <FiRefreshCw className="animate-spin" />}
              {saving ? "Saving..." : mode === "add" ? "Add Category" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;