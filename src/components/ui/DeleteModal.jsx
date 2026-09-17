import React from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

export default function DeleteModal({ isOpen, onClose, onConfirm, title = "Delete Item" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ব্যাকগ্রাউন্ড ব্লার এবং ডার্ক ওভারলে */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* মোডাল বক্স */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 transform transition-all scale-100 font-sans">
        
        {/* ক্লোজ বাটন */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* কনটেন্ট সেকশন */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* ওয়ার্নিং আইকন বক্স */}
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Are you absolutely sure?</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Do you really want to delete <span className="font-semibold text-slate-700">"{title}"</span>? This action cannot be undone and the data will be permanently removed.
          </p>
        </div>

        {/* অ্যাকশন বাটন গ্রুপ */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-rose-100 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Yes, Delete
          </button>
        </div>

      </div>
    </div>
  );
}