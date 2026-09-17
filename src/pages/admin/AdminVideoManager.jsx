import React, { useEffect, useMemo, useState } from "react";
import { 
  Video, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  X,
  Eye, 
  EyeOff, 
  PlayCircle,
  ExternalLink,
  Check
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_APP_SERVER_URL || "").replace(/\/$/, "");

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function getYouTubeThumbnail(url) {
  if (!url) return "";
  const m1 = url.match(/v=([^&]+)/);
  const m2 = url.match(/youtu\.be\/([^?]+)/);
  const id = m1?.[1] || m2?.[1] || "";
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : "";
}

function getYouTubeEmbed(url) {
  if (!url) return "";
  const m1 = url.match(/v=([^&]+)/);
  const m2 = url.match(/youtu\.be\/([^?]+)/);
  const id = m1?.[1] || m2?.[1] || "";
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

export default function AdminVideoManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({ title: "", description: "", youtubeUrl: "" });
  const [saving, setSaving] = useState(false);
  
  // 🌟 এডিট মোড ট্র্যাকিং স্টেট
  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState({ type: "", msg: "" });
  const show = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast({ type: "", msg: "" }), 2200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api("/api/videos/admin");
      setItems(data.items || []);
    } catch (e) {
      show("err", e.message);
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const preview = useMemo(() => getYouTubeEmbed(form.youtubeUrl), [form.youtubeUrl]);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      String(item?.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // 🌟 সাবমিট হ্যান্ডলার (Add অথবা Update দুটোই একসাথে হ্যান্ডেল করবে)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.youtubeUrl.trim()) return show("err", "Title and YouTube URL required");
    
    setSaving(true);
    try {
      if (editingId) {
        // 🌟 UPDATE MODE (PATCH Request)
        const updated = await api(`/api/videos/admin/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setItems((prev) => prev.map((x) => (x._id === editingId ? updated : x)));
        setEditingId(null);
        show("ok", "Video updated successfully");
      } else {
        // 🌟 CREATE MODE (POST Request)
        const created = await api("/api/videos/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setItems((prev) => [created, ...prev]);
        show("ok", "Video added successfully");
      }
      setForm({ title: "", description: "", youtubeUrl: "" });
    } catch (e) {
      show("err", e.message);
    } finally {
      setSaving(false);
    }
  };

  // 🌟 এডিট বাটনে ক্লিক করলে ফর্ম ফিলাপ করার লজিক
  const handleEditClick = (v) => {
    setEditingId(v._id);
    setForm({
      title: v.title || "",
      description: v.description || "",
      youtubeUrl: v.youtubeUrl || "",
    });
    // ফর্ম এরিয়াতে স্ক্রল করার জন্য (মাইনর চমৎকার UX)
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🌟 এডিট মোড ক্যানসেল করার লজিক
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ title: "", description: "", youtubeUrl: "" });
  };

  const toggle = async (v) => {
    try {
      const updated = await api(`/api/videos/admin/${v._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !(v.isActive ?? true) }),
      });
      setItems((prev) => prev.map((x) => (x._id === v._id ? updated : x)));
      show("ok", updated.isActive ? "Video Activated" : "Video Hidden");
    } catch (e) {
      show("err", e.message);
    }
  };

  const remove = async (v) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await api(`/api/videos/admin/${v._id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x._id !== v._id));
      if (editingId === v._id) handleCancelEdit(); // এডিট করা অবস্থায় ডিলিট করলে ফর্ম রিসেট হবে
      show("ok", "Video deleted");
    } catch (e) {
      show("err", e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      
      {/* ================== Top Header Banner Ribbon ================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Video Manager</h1>
            <p className="text-sm text-slate-500">Add YouTube videos, show/hide, and delete.</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium text-xs border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Connected
        </div>
      </div>

      {/* ================== Workspace: Form & Preview split ================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-indigo-600" /> 
            {editingId ? "Edit Video Content" : "Video Details"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Title *</label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition bg-slate-50/50 font-medium"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600">YouTube URL *</label>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition bg-slate-50/50 font-medium"
                value={form.youtubeUrl}
                onChange={(e) => setForm((s) => ({ ...s, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="mt-1 text-[11px] text-slate-400 font-medium">Supports youtube.com/watch?v=ID or youtu.be/ID</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600">Description</label>
              <textarea
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition resize-none bg-slate-50/50 font-medium"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Short description about the video..."
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-60 text-white ${
                  editingId 
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10" 
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10"
                }`}
              >
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {saving ? "Saving..." : editingId ? "Update Video" : "Add Video"}
              </button>
              
              {/* 🌟 এডিট মোডে থাকলে Cancel বাটন রেন্ডার হবে */}
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold bg-white hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Preview Box */}
        <div className="lg:col-span-5 bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Preview</h4>
          
          <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-900 aspect-video relative flex items-center justify-center shadow-inner">
            {preview ? (
              <iframe
                className="w-full h-full"
                src={preview}
                title="Preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-4 space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-white/40">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div className="text-white/60 text-xs font-medium max-w-[200px]">
                  Paste a valid YouTube URL to preview
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================== Data List Section ================== */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Filter Ribbon */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 bg-indigo-50/60 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700">
            Total Videos: <span className="text-sm font-black">{items.length}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button 
              onClick={load} 
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Data Table Architecture */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium animate-pulse">
              Loading Video Core Pipelines...
            </div>
          ) : filteredItems.length ? (
            <table className="min-w-full text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-center w-12">#</th>
                  <th className="px-6 py-3 text-left w-32">Video</th>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left w-32">Status</th>
                  <th className="px-6 py-3 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((v, index) => {
                  const thumb = getYouTubeThumbnail(v.youtubeUrl);
                  const isCurrentlyEditing = editingId === v._id;

                  return (
                    <tr 
                      key={v._id} 
                      className={`transition-colors ${
                        isCurrentlyEditing ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Counter Index */}
                      <td className="px-6 py-4 text-center font-mono text-slate-400 font-bold">
                        {String(index + 1).padStart(2, "0")}
                      </td>
                      
                      {/* YouTube Thumbnail Widget Area */}
                      <td className="px-6 py-4">
                        <div className="w-24 aspect-video rounded-lg bg-slate-900 border border-slate-100 p-0.5 overflow-hidden shadow-sm relative group/thumb">
                          {thumb ? (
                            <img src={thumb} alt="" className="w-full h-full object-cover rounded-md" />
                          ) : (
                            <div className="w-full h-full bg-slate-900" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <PlayCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </td>

                      {/* Content Details */}
                      <td className="px-6 py-4">
                        <div className="max-w-md space-y-0.5">
                          <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">
                            {v.title}
                          </p>
                          {v.description && (
                            <p className="text-slate-400 font-medium text-[11px] line-clamp-1">{v.description}</p>
                          )}
                          <a 
                            href={v.youtubeUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-600 font-semibold pt-0.5"
                          >
                            Open Source <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </td>

                      {/* Status Dot Badges */}
                      <td className="px-6 py-4">
                        {v.isActive ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-100 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full font-bold text-[10px] border border-slate-200 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                          </div>
                        )}
                      </td>

                      {/* Actions Group Icons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 🌟 নতুন এডিট বাটন */}
                          <button
                            onClick={() => handleEditClick(v)}
                            className={`p-2 rounded-xl border transition-all ${
                              isCurrentlyEditing 
                                ? "bg-amber-500 border-amber-500 text-white" 
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            }`}
                            title="Edit Video"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => toggle(v)}
                            className={`p-2 rounded-xl border transition-all ${
                              v.isActive 
                                ? "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700" 
                                : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100"
                            }`}
                            title={v.isActive ? "Hide Video" : "Show Video"}
                          >
                            {v.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          
                          <button
                            onClick={() => remove(v)}
                            className="p-2 bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 hover:text-rose-700 rounded-xl transition-all"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 border flex items-center justify-center text-slate-400 mx-auto">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Videos Uploaded</h3>
              <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-normal">
                Add valid YouTube communication links above to showcase items on the user media interface.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Toast Alerts */}
      {toast.msg && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-xl border flex items-center gap-2 ${
              toast.type === "ok"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-100/40"
                : "bg-rose-50 text-rose-800 border-rose-200 shadow-rose-100/40"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${toast.type === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}