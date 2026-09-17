import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  Image, 
  Plus, 
  Trash2, 
  Eye, 
  Search, 
  SlidersHorizontal, 
  UploadCloud, 
  Grid, 
  TrendingUp, 
  CheckCircle,
  X,
  FileImage
} from "lucide-react";

// কাস্টম ডিলিট মোডাল ইমপোর্ট করুন (আপনার ফোল্ডার স্ট্রাকচার অনুযায়ী পাথ ঠিক করে নিবেন)
import DeleteModal from "../components/ui/DeleteModal"; 

export default function BannerStudio() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // কাস্টম মোডাল এবং ডিলিট ট্র্যাকিং এর জন্য স্টেট
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  // Form states matching backend (title + image)
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [posting, setPosting] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const BASE_URL = import.meta.env.VITE_APP_SERVER_URL;

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${BASE_URL}api/banners`);
      setBanners(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching banners:", error);
      setError("Failed to load banners.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image first.");
      return;
    }
    
    setPosting(true);
    setMessage("");
    setError("");

    try {
      const form = new FormData();
      if (title) form.append("title", title);
      form.append("image", file);

      await axios.post(`${BASE_URL}api/banners`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle("");
      setFile(null);
      setPreviewUrl("");
      setMessage("Banner successfully published!");
      fetchBanners();
    } catch (err) {
      console.error(err);
      setError("Failed to post banner. Try again.");
    } finally {
      setPosting(false);
    }
  };

  // ডিলিট বাটন ক্লিক করলে মোডাল ওপেন করার ফাংশন
  const handleDeleteClick = (id, bannerTitle) => {
    setSelectedId(id);
    setSelectedTitle(bannerTitle || "Untitled Artwork banner");
    setIsModalOpen(true);
  };

  // মোডাল থেকে "Yes, Delete" কনফার্ম করলে ব্যাকএন্ড রিকোয়েস্ট পাঠানোর ফাংশন
  const handleConfirmDelete = async () => {
    setIsModalOpen(false); // মোডাল বন্ধ হবে
    setMessage("");
    setError("");

    try {
      await axios.delete(`${BASE_URL}api/banners/${selectedId}`);
      setBanners(banners.filter((banner) => banner._id !== selectedId));
      setMessage("Banner deleted successfully.");
    } catch (error) {
      console.error("Error deleting banner:", error);
      setError("Failed to delete banner.");
    }
  };

  // UI Stats Counters
  const totalBanners = banners.length;
  const activeBanners = banners.length;

  // Filtered Queue
  const filteredBanners = useMemo(() => {
    return banners.filter(b => 
      (b.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [banners, searchTerm]);

  return (
    <div className="px-1 p-2 bg-slate-50 min-h-screen w-full font-sans text-slate-800 relative">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Banner Studio</h1>
          <p className="text-sm text-slate-500">Create, manage and organize your homepage banners.</p>
        </div>
        <button 
          onClick={() => document.getElementById("post-aside")?.scrollIntoView({ behavior: "smooth" })}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New Banner
        </button>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* 2. Top Analytics Grid cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Banners</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalBanners}</h3>
            <p className="text-xs text-slate-400 mt-1">All banners</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Grid className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Banners</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeBanners}</h3>
            <p className="text-xs text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md font-medium inline-block mt-1 text-[10px]">Active</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Views</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">24.6K</h3>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium"><TrendingUp className="w-3 h-3" /> +18.5%</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Eye className="w-5 h-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Click Through Rate</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">3.24%</h3>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium"><TrendingUp className="w-3 h-3" /> +8.7%</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl"><Image className="w-5 h-5" /></div>
        </div>
      </div>

      {/* 3. Main Split Framework Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Interactive Creation Sidebar */}
        <aside id="post-aside" className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Create New Banner</h3>
            <p className="text-xs text-slate-400">Upload a new banner artwork and publish it instantly.</p>
          </div>

          <form onSubmit={handlePost} className="space-y-4">
            {/* Visual Upload Zone */}
            <div>
              <label className="group flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-6 text-center cursor-pointer min-h-[180px] hover:border-indigo-500 hover:bg-white transition-all relative overflow-hidden">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full absolute inset-0 object-cover" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setFile(null); setPreviewUrl(""); }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Drag & drop your image here</p>
                    <p className="text-[11px] text-slate-400">or <span className="text-indigo-600 underline font-semibold">click to browse</span></p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, WEBP (Max 5MB)<br />Recommended: 1920 x 600px</p>
                  </div>
                )}
                <input 
                  type="file" accept="image/*" className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Banner Title (Optional)</label>
              <input 
                type="text" value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Sale 2025"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Link (Optional)</label>
              <input 
                type="text" placeholder="https://Kroykori.com/sale" disabled
                className="w-full border border-slate-100 rounded-xl px-3 py-2.5 text-sm bg-slate-100 text-slate-400 select-none cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Add a redirection link where banner click points.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50/50 appearance-none font-semibold text-slate-700">
                <option value="active">Active</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button 
                type="button"
                onClick={() => { setTitle(""); setFile(null); setPreviewUrl(""); }}
                className="col-span-1 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold py-3 hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
              <button 
                type="submit"
                disabled={posting || !file}
                className="col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
              >
                {posting ? "Publishing…" : "Upload & Publish"}
              </button>
            </div>
          </form>
        </aside>

        {/* Right Gallery Portfolio Queue Grid */}
        <section className="lg:col-span-8 space-y-4">
          
          {/* Filtering Header Utilities */}
          <div className="bg-white p-4 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">Banner Gallery <span className="text-slate-400 text-xs font-bold ml-1">({banners.length})</span></h3>
              <p className="text-xs text-slate-400 font-medium">Manage your currently hosted canvas slider views</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" placeholder="Search banners..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <select className="text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-xl font-bold text-slate-600 focus:outline-none">
                <option>All Status</option>
              </select>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold bg-white">
                <SlidersHorizontal className="w-3 h-3" /> Sort: Latest
              </button>
            </div>
          </div>

          {/* Cards Data Layout Pipeline */}
          {loading ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 shadow-sm font-medium">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              Synchronizing studio media pipeline…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
              {filteredBanners.map((banner) => (
                <div 
                  key={banner._id}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
                >
                  {/* Dynamic Cover Img Canvas */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                    <img 
                      src={banner.imageUrl || "/placeholder.png"} 
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                      loading="lazy"
                    />

                    {/* Meta floating status tags */}
                    <div className="absolute top-3 left-3 bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-md uppercase shadow-sm tracking-wider">
                      Active
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <Eye className="w-3 h-3" /> 4.1K
                    </div>
                  </div>

                  {/* Foot Description Nodes */}
                  <div className="p-4 flex items-center justify-between gap-3 bg-white border-t border-slate-50">
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 truncate">
                        {banner.title || "Untitled Artwork banner"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Updated: 24 May 2025</p>
                    </div>

                    {/* Delete Trigger Block connected to custom modal */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleDeleteClick(banner._id, banner.title)}
                        className="p-2 bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Delete Banner Layout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredBanners.length === 0 && (
                <div className="col-span-full bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-medium shadow-sm">
                  <FileImage className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No banners active matching query elements.
                </div>
              )}
            </div>
          )}
        </section>

      </div>

      {/* রেন্ডার করা হয়েছে আপনার কাস্টম প্রিমিয়াম ডিলিট মোডাল */}
      <DeleteModal 
        isOpen={isModalOpen}
        title={selectedTitle}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}