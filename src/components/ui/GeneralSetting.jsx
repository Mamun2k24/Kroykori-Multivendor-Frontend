import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import useGeneralSettings from "../../hooks/useGeneralSettings";

// Note: আপনি চাইলে আপনার প্রজেক্টের আইকন লাইব্রেরি (যেমন Lucide-React) থেকে আইকনগুলো ইমপোর্ট করে নিতে পারেন।
export default function GeneralSetting() {
  const { data, isLoading, updateGeneralSettings, uploadLogo, deleteLogo } = useGeneralSettings();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
    description: "",
    openTime: "",
    facebookUrl: "",
    instagramUrl: "",
    whatsappUrl: "",
    youtubeUrl: "",
  });

  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        description: data.description || "",
        openTime: data.openTime || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        whatsappUrl: data.whatsappUrl || "",
        youtubeUrl: data.youtubeUrl || "",
      });
      setLogoPreview(data.logoUrl || "");
    }
  }, [data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // লোগো হ্যান্ডলিং
  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ক্লায়েন্ট সাইড প্রিভিউ
    setLogoPreview(URL.createObjectURL(file));

    // আপনার hook-এ যদি আলাদা mutation থাকে তা কল করার জন্য
    if (uploadLogo?.mutate) {
      const formData = new FormData();
      formData.append("logo", file);
      
      uploadLogo.mutate(formData, {
        onSuccess: (res) => {
          toast.success("Logo uploaded successfully");
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Logo upload failed");
        }
      });
    }
  };

  const handleLogoDelete = () => {
    if (deleteLogo?.mutate) {
      deleteLogo.mutate(null, {
        onSuccess: () => {
          setLogoPreview("");
          toast.success("Logo removed");
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || "Failed to remove logo");
        }
      });
    } else {
      setLogoPreview("");
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    updateGeneralSettings.mutate(form, {
      onSuccess: (res) => {
        toast.success(res?.message || "Settings updated successfully");
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Update failed");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-6">
        <div className="h-12 bg-slate-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 lg:px-1 mt-2.5 space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            {/* Settings Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">General Settings</h1>
            <p className="text-sm text-slate-500">Manage your website branding, contact information and social media links.</p>
          </div>
        </div>
        <div className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium text-xs border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Ready
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* Two Columns Grid: Branding & Contact Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section: Branding */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <span className="text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-800">Branding</h3>
                <p className="text-xs text-slate-400">Upload your logo and set brand name.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Logo</label>
              <div className="border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 min-h-[160px]">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo.png" className="max-h-20 object-contain mb-2" />
                ) : (
                  <div className="text-slate-300 text-xs font-medium mb-2">No Logo Uploaded</div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onLogoChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleLogoUploadClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    Upload Logo
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleLogoDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-100 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      Delete Logo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-3">Recommended: PNG, JPG, SVG (max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Section: Contact Information & Open Time */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
              <span className="text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-800">Contact Information</h3>
                <p className="text-xs text-slate-400">Update your contact details.</p>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Phone</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                  placeholder="017xxxxxxxx"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </span>
                <input
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                  placeholder="support@Kroykori.com"
                />
              </div>
            </div>

            {/* Open Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Open Time</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                <input
                  name="openTime"
                  value={form.openTime}
                  onChange={onChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition"
                  placeholder="Sat - Thu : 9 AM - 10 PM"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Address */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <span className="text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </span>
            <div>
              <h3 className="font-bold text-slate-800">Address</h3>
              <p className="text-xs text-slate-400">Your store or office address.</p>
            </div>
          </div>
          <textarea
            name="address"
            value={form.address}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition resize-none"
            placeholder="Dhaka, Bangladesh"
          />
        </div>

        {/* Section: Website Description */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <span className="text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
            <div>
              <h3 className="font-bold text-slate-800">Website Description</h3>
              <p className="text-xs text-slate-400">Short description about your website.</p>
            </div>
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition resize-none"
            placeholder="Tell something about your website..."
          />
        </div>

        {/* Section: Social Media Links */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <span className="text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            </span>
            <div>
              <h3 className="font-bold text-slate-800">Social Media Links</h3>
              <p className="text-xs text-slate-400">Add your social media profile links.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Facebook */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-[#1877F2]/10 text-[#1877F2] rounded-full shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
              </div>
              <div className="w-full relative border border-slate-200 rounded-xl px-4 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
                <span className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500">Facebook</span>
                <input
                  name="facebookUrl"
                  value={form.facebookUrl}
                  onChange={onChange}
                  className="w-full bg-transparent outline-none text-slate-700 text-sm py-1"
                  placeholder="https://facebook.com/yourbrand"
                />
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-[#E4405F]/10 text-[#E4405F] rounded-full shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <div className="w-full relative border border-slate-200 rounded-xl px-4 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
                <span className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500">Instagram</span>
                <input
                  name="instagramUrl"
                  value={form.instagramUrl}
                  onChange={onChange}
                  className="w-full bg-transparent outline-none text-slate-700 text-sm py-1"
                  placeholder="https://instagram.com/yourbrand"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-[#25D366]/10 text-[#25D366] rounded-full shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div className="w-full relative border border-slate-200 rounded-xl px-4 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
                <span className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500">WhatsApp</span>
                <input
                  name="whatsappUrl"
                  value={form.whatsappUrl}
                  onChange={onChange}
                  className="w-full bg-transparent outline-none text-slate-700 text-sm py-1"
                  placeholder="https://wa.me/8801xxxxxxxxx"
                />
              </div>
            </div>

            {/* YouTube */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-[#FF0000]/10 text-[#FF0000] rounded-full shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </div>
              <div className="w-full relative border border-slate-200 rounded-xl px-4 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
                <span className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500">YouTube</span>
                <input
                  name="youtubeUrl"
                  value={form.youtubeUrl}
                  onChange={onChange}
                  className="w-full bg-transparent outline-none text-slate-700 text-sm py-1"
                  placeholder="https://youtube.com/@yourbrand"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={updateGeneralSettings.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 shadow-sm shadow-indigo-600/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            {updateGeneralSettings.isPending ? "Saving Changes..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => {
              setForm({
                phone: data?.phone || "",
                email: data?.email || "",
                address: data?.address || "",
                description: data?.description || "",
                openTime: data?.openTime || "",
                facebookUrl: data?.facebookUrl || "",
                instagramUrl: data?.instagramUrl || "",
                whatsappUrl: data?.whatsappUrl || "",
                youtubeUrl: data?.youtubeUrl || "",
              });
              setLogoPreview(data?.logoUrl || "");
              toast.info("Reset done");
            }}
            className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.212 9H18"/></svg>
            Reset
          </button>
        </div>

      </form>
    </div>
  );
}