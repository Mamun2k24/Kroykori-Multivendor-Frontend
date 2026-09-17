import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiSave,
  FiImage,
  FiVideo,
  FiTag,
  FiCheckCircle,
  FiGlobe,
  FiPercent,
  FiUploadCloud,
  FiExternalLink,
} from "react-icons/fi";

import useAxiosSecure from "../../hooks/useAxiosSecure";

const EditLandingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    status: "draft",
    hero: {
      headline: "",
      subHeadline: "",
      image: "",
    },
    offer: {
      enabled: false,
      oldPrice: "",
      offerPrice: "",
      discountText: "",
    },
    video: {
      enabled: false,
      type: "youtube",
      url: "",
    },
  });

  // =====================
  // LOAD DATA
  // =====================
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axiosSecure.get(`/api/landing-pages/${id}`);
        const data = res.data.data || res.data;

        setForm({
          title: data.title || "",
          slug: data.slug || "",
          status: data.status || "draft",
          hero: {
            headline: data.hero?.headline || "",
            subHeadline: data.hero?.subHeadline || "",
            image: data.hero?.image || "",
          },
          offer: {
            enabled: data.offer?.enabled || false,
            oldPrice: data.offer?.oldPrice || "",
            offerPrice: data.offer?.offerPrice || "",
            discountText: data.offer?.discountText || "",
          },
          video: {
            enabled: data.video?.enabled || false,
            type: data.video?.type || "youtube",
            url: data.video?.url || "",
          },
        });
      } catch (error) {
        console.log(error);
        alert("Failed to load landing page");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const updateField = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  // Image Upload via ImgBB
  const handleImageUpload = async (e) => {
    const image = e.target.files[0];
    if (!image) return;

    try {
      setUploadingImage(true);
      const body = new FormData();
      body.append("image", image);

      const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
        body,
      );

      const imageUrl = res.data.data.url;
      updateField("hero", "image", imageUrl);
    } catch (error) {
      console.log(error);
      alert("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const savePage = async () => {
    try {
      setSaving(true);
      await axiosSecure.put(`/api/landing-pages/${id}`, form);
      alert("Landing page updated successfully");
      navigate("/dashboard/landing-pages");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const calculateDiscount = () => {
    const oldP = Number(form.offer.oldPrice);
    const newP = Number(form.offer.offerPrice);
    if (oldP > 0 && newP > 0 && oldP > newP) {
      return Math.round(((oldP - newP) / oldP) * 100);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-500">
            Landing Page লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 md:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-2"
          >
            <FiArrowLeft /> ফিরে যান
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Edit Landing Page
            </h1>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                form.status === "published"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {form.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {form.slug && (
            <a
              href={`/lp/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition"
            >
              <FiExternalLink />
              View Live
            </a>
          )}
          <button
            onClick={savePage}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition"
          >
            <FiSave />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <FiTag className="text-xl" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Basic Information
                </h2>
                <p className="text-xs text-slate-400">
                  ল্যান্ডিং পেজের শিরোনাম ও কাস্টম ইউআরএল
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Page Title *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: প্রিমিয়াম লেদার ওয়ালেট ধামাকা অফার"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  URL Slug *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-slate-400 font-medium select-none">
                    /landing/
                  </span>
                  <input
                    type="text"
                    placeholder="leather-wallet"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full pl-20 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Hero Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <FiImage className="text-xl" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Hero Section (Banner & Content)
                </h2>
                <p className="text-xs text-slate-400">
                  কাস্টমারকে আকৃষ্ট করার প্রধান ব্যানার ও টেক্সট
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Main Headline
                </label>
                <input
                  type="text"
                  placeholder="যেমন: আসল চামড়ার তৈরি দীর্ঘস্থায়ী স্টাইলিশ ওয়ালেট"
                  value={form.hero.headline}
                  onChange={(e) =>
                    updateField("hero", "headline", e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Sub Headline / Description
                </label>
             <textarea

rows="8"

placeholder="প্রোডাক্ট সম্পর্কে বিস্তারিত বর্ণনা লিখুন..."

value={form.hero.subHeadline}

onChange={(e)=>
  updateField(
    "hero",
    "subHeadline",
    e.target.value
  )
}

className="
w-full
min-h-[180px]
resize-y
border
border-slate-300
rounded-xl
px-4
py-3
text-sm
text-slate-700
focus:outline-none
focus:ring-2
focus:ring-indigo-500
focus:border-indigo-500
"

 />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Hero Image
                </label>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      placeholder="Image URL অথবা নিচে ফাইল আপলোড করুন"
                      value={form.hero.image}
                      onChange={(e) =>
                        updateField("hero", "image", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                    />
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer pt-1">
                      <FiUploadCloud className="text-base" />
                      <span>
                        {uploadingImage
                          ? "আপলোড হচ্ছে..."
                          : "নতুন ইমেজ ফাইল আপলোড করুন"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>

                  {form.hero.image && (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 w-28 h-28 shrink-0 bg-slate-100">
                      <img
                        src={form.hero.image}
                        alt="Hero Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Offer Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FiTag className="text-xl" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Special Offer & Pricing
                  </h2>
                  <p className="text-xs text-slate-400">
                    ডিসকাউন্ট এবং অফার প্রাইস কনফিগারেশন
                  </p>
                </div>
              </div>

              {calculateDiscount() && form.offer.enabled && (
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <FiPercent /> {calculateDiscount()}% Discount
                </span>
              )}
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.offer.enabled}
                  onChange={(e) =>
                    updateField("offer", "enabled", e.target.checked)
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Enable Special Offer Pricing
                </span>
              </label>

              {form.offer.enabled && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                        Old Price (পূর্বের মূল্য)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">
                          ৳
                        </span>
                        <input
                          type="number"
                          placeholder="1200"
                          value={form.offer.oldPrice}
                          onChange={(e) =>
                            updateField("offer", "oldPrice", e.target.value)
                          }
                          className="w-full pl-9 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                        Offer Price (বর্তমান অফার মূল্য)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold">
                          ৳
                        </span>
                        <input
                          type="number"
                          placeholder="850"
                          value={form.offer.offerPrice}
                          onChange={(e) =>
                            updateField("offer", "offerPrice", e.target.value)
                          }
                          className="w-full pl-9 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Custom Discount Badge Text
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: ৩০% ছাড় অথবা সীমিত সময়ের অফার"
                      value={form.offer.discountText}
                      onChange={(e) =>
                        updateField("offer", "discountText", e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Video Showcase */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <FiVideo className="text-xl" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Product Video Showcase
                </h2>
                <p className="text-xs text-slate-400">
                  ইউটিউব বা ভিডিও এম্বেড শোকেস
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.video.enabled}
                  onChange={(e) =>
                    updateField("video", "enabled", e.target.checked)
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-800">
                  Show Video on Landing Page
                </span>
              </label>

              {form.video.enabled && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    YouTube Embed URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/embed/xxxxxx"
                    value={form.video.url}
                    onChange={(e) =>
                      updateField("video", "url", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Settings & Publishing */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 sticky top-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                <FiCheckCircle className="text-xl" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Publish Settings
                </h2>
                <p className="text-xs text-slate-400">স্ট্যাটাস ও সেভ অপশন</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Page Visibility Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-3.5 outline-none transition"
              >
                <option value="draft">📁 Draft (লুকানো থাকবে)</option>
                <option value="published">🚀 Published (লাইভ থাকবে)</option>
              </select>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <button
                onClick={savePage}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white p-3.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 transition"
              >
                <FiSave className="text-base" />
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full p-3.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLandingPage;
