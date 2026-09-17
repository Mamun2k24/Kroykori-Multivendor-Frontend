import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import useAxiosSecure from "../../hooks/useAxiosSecure";

import {
  FiShoppingBag,
  FiImage,
  FiVideo,
  FiTag,
  FiArrowLeft,
  FiCheckCircle,
  FiPercent,
  FiUploadCloud,
} from "react-icons/fi";

const CreateLandingPage = () => {
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",

    slug: "",

    product: "",

    template: "product-sale-1",

    hero: {
      headline: "",

      subHeadline: "",

      image: "",

      buttonText: "অর্ডার করুন",
    },

    video: {
      enabled: false,

      type: "youtube",

      url: "",
    },

    offer: {
      enabled: true,

      oldPrice: 0,

      offerPrice: 0,

      discountText: "",
    },
  });

  // =========================
  // PRODUCTS
  // =========================

  const {
    data: products = [],

    isLoading,
  } = useQuery({
    queryKey: ["landing-products"],

    queryFn: async () => {
      const res = await axiosSecure.get("/api/products/public");

      return res.data.products || res.data;
    },
  });

  const handleBasicChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const handleHeroChange = (e) => {
    setFormData({
      ...formData,

      hero: {
        ...formData.hero,

        [e.target.name]: e.target.value,
      },
    });
  };

  const handleVideoChange = (e) => {
    setFormData({
      ...formData,

      video: {
        ...formData.video,

        [e.target.name]: e.target.value,
      },
    });
  };

  const handleOfferChange = (e) => {
    setFormData({
      ...formData,

      offer: {
        ...formData.offer,

        [e.target.name]: Number(e.target.value),
      },
    });
  };

  // =========================
  // IMAGE UPLOAD
  // =========================

  const handleHeroImageUpload = async (e) => {
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

      setFormData({
        ...formData,

        hero: {
          ...formData.hero,

          image: imageUrl,
        },
      });
    } catch (error) {
      console.log(error);

      alert("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const calculateDiscount = () => {
    const { oldPrice, offerPrice } = formData.offer;

    if (oldPrice > 0 && offerPrice > 0 && oldPrice > offerPrice) {
      const discount = Math.round(((oldPrice - offerPrice) / oldPrice) * 100);

      return `${discount}% ছাড়`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      await axiosSecure.post(
        "/api/landing-pages",

        formData,
      );

      alert("Landing Page Created Successfully");

      navigate("/dashboard/landing-pages");
    } catch (error) {
      console.log(error);

      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
flex
items-center
gap-2
text-slate-500
mb-3
"
        >
          <FiArrowLeft />
          ফিরে যান
        </button>

        <h1 className="text-3xl font-bold text-slate-900">
          Create Landing Page
        </h1>

        <p className="text-slate-500 mt-2">
          আপনার product এর জন্য sales driven landing page তৈরি করুন
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="
max-w-5xl
mx-auto
space-y-6
"
      >
        <div
          className="
bg-white
rounded-2xl
border
border-slate-200
shadow-sm
p-6
space-y-5
"
        >
          <div className="flex items-center gap-3 border-b pb-4">
            <span
              className="
p-3
bg-indigo-50
text-indigo-600
rounded-xl
"
            >
              <FiShoppingBag />
            </span>

            <div>
              <h2 className="font-bold text-slate-800">Product Information</h2>

              <p className="text-xs text-slate-400">
                Select product for this landing page
              </p>
            </div>
          </div>

          <label className="text-sm font-semibold">Select Product</label>

          <select
            required
            value={formData.product}
            onChange={(e) =>
              setFormData({
                ...formData,

                product: e.target.value,
              })
            }
            className="
w-full
bg-slate-50
border
rounded-xl
p-3
outline-none
"
          >
            <option value="">Choose Product</option>

            {isLoading ? (
              <option>Loading...</option>
            ) : (
              products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.productName}- ৳{product.price}
                </option>
              ))
            )}
          </select>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold">Landing Title</label>

              <input
                name="title"
                value={formData.title}
                onChange={handleBasicChange}
                className="
w-full
bg-slate-50
border
rounded-xl
p-3
mt-2
"
                placeholder="Premium Product Offer"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">URL Slug</label>

              <input
                name="slug"
                value={formData.slug}
                onChange={handleBasicChange}
                className="
w-full
bg-slate-50
border
rounded-xl
p-3
mt-2
"
                placeholder="product-offer"
              />
            </div>
          </div>
        </div>

        <div
          className="
bg-white
rounded-2xl
border
shadow-sm
p-6
space-y-5
"
        >
          <div className="flex items-center gap-3 border-b pb-4">
            <span
              className="
p-3
bg-orange-50
text-orange-600
rounded-xl
"
            >
              <FiImage />
            </span>

            <div>
              <h2 className="font-bold">Hero Section</h2>

              <p className="text-xs text-slate-400">Main sales banner</p>
            </div>
          </div>

          <input
            name="headline"
            value={formData.hero.headline}
            onChange={handleHeroChange}
            placeholder="Main headline"
            className="
w-full
border
bg-slate-50
rounded-xl
p-3
"
          />

          <input
            name="subHeadline"
            value={formData.hero.subHeadline}
            onChange={handleHeroChange}
            placeholder="Short description"
            className="
w-full
border
bg-slate-50
rounded-xl
p-3
"
          />

          <label className="font-semibold text-sm">Hero Image Upload</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleHeroImageUpload}
            className="
w-full
border
rounded-xl
p-3
"
          />

          {uploadingImage && (
            <p className="text-indigo-600 text-sm">Uploading image...</p>
          )}

          {formData.hero.image && (
            <img
              src={formData.hero.image}
              alt="preview"
              className="
w-full
h-64
object-cover
rounded-xl
mt-4
"
            />
          )}

          <input
            name="buttonText"
            value={formData.hero.buttonText}
            onChange={handleHeroChange}
            placeholder="CTA Button Text"
            className="
w-full
border
rounded-xl
p-3
"
          />
        </div>

        <div
          className="
bg-white
rounded-2xl
border
shadow-sm
p-6
space-y-5
"
        >
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <span
                className="
p-3
bg-green-50
text-green-600
rounded-xl
"
              >
                <FiTag />
              </span>

              <h2 className="font-bold">Offer Pricing</h2>
            </div>

            {calculateDiscount() && (
              <span
                className="
bg-green-100
text-green-700
px-3
py-1
rounded-full
text-sm
font-bold
"
              >
                <FiPercent />

                {calculateDiscount()}
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <input
              type="number"
              name="oldPrice"
              value={formData.offer.oldPrice || ""}
              onChange={handleOfferChange}
              placeholder="Old Price"
              className="
border
rounded-xl
p-3
"
            />

            <input
              type="number"
              name="offerPrice"
              value={formData.offer.offerPrice || ""}
              onChange={handleOfferChange}
              placeholder="Offer Price"
              className="
border
rounded-xl
p-3
"
            />
          </div>
        </div>

        <div
          className="
bg-white
rounded-2xl
border
shadow-sm
p-6
space-y-5
"
        >
          <div className="flex gap-3 items-center">
            <span
              className="
p-3
bg-red-50
text-red-600
rounded-xl
"
            >
              <FiVideo />
            </span>

            <h2 className="font-bold">Product Video</h2>
          </div>

          <input
            name="url"
            value={formData.video.url}
            onChange={handleVideoChange}
            placeholder="YouTube embed URL"
            className="
w-full
border
rounded-xl
p-3
"
          />
        </div>

        <div
          className="
flex
justify-end
gap-4
pb-10
"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
px-6
py-3
rounded-xl
border
"
          >
            Cancel
          </button>

          <button
            disabled={isSubmitting}
            className="
flex
items-center
gap-2
bg-indigo-600
text-white
px-8
py-3
rounded-xl
font-bold
"
          >
            <FiCheckCircle />

            {isSubmitting ? "Creating..." : "Create Landing Page"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLandingPage;
