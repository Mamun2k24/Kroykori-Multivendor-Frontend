import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FiShoppingCart,
  FiCheckCircle,
  FiMinus,
  FiPlus,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiPhoneCall,
  FiZap,
} from "react-icons/fi";
import useAxiosSecure from "../../hooks/useAxiosSecure";

const LandingPageView = () => {
  const { slug } = useParams();
  const axiosSecure = useAxiosSecure();

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [orderForm, setOrderForm] = useState({
    name: "",
    mobile: "",
    district: "",
    upazila: "",
    address: "",
    senderNumber: "",
    transactionId: "",
  });

  const {
    data: page,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const res = await axiosSecure.get(`/api/landing-pages/public/${slug}`);
      return res.data.data || res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium text-sm">পেজ লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border text-center max-w-md w-full">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">ল্যান্ডিং পেজ পাওয়া যায়নি!</h2>
          <p className="text-sm text-slate-500">লিংকটি সঠিক নয় অথবা অফারটি বর্তমানে স্থগিত রয়েছে।</p>
        </div>
      </div>
    );
  }

  const product = page.product;
  const price = Number(page.offer?.offerPrice || product?.price || 0);
  const deliveryCharge = 60;
  const total = price * quantity + deliveryCharge;

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-sans selection:bg-rose-500 selection:text-white pb-24 md:pb-16">
      
      {/* 1. TOP NOTICE / PROMO TICKER */}
      <div className="bg-rose-600 text-white text-center py-2.5 px-4 text-xs md:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm">
        <FiZap className="animate-bounce" />
        <span>🔥 সীমিত সময়ের ধামাকা অফার! সারা দেশে দ্রুত হোম ডেলিভারি সুবিধা।</span>
      </div>

      {/* 2. MINIMAL HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="font-extrabold text-lg md:text-2xl text-slate-900 tracking-tight">
            {page.title?.split(" ")[0] || "Kroykori"}
          </div>
          <button
            onClick={() => {
              document.getElementById("checkout").scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs md:text-sm font-bold px-5 py-2.5 rounded-full transition shadow-md shadow-rose-200 flex items-center gap-2"
          >
            <FiShoppingCart className="text-sm" />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3.5 sm:px-5 py-6 md:py-10 space-y-8 md:space-y-12">
        
        {/* 3. HERO SECTION */}
        <section className="bg-white rounded-3xl p-5 md:p-10 border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left / Top on mobile: Product Media */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group">
              <img
                src={page.hero?.image || product?.productImage?.[0]}
                alt={page.title}
                className="w-full h-auto max-h-[420px] md:max-h-[480px] object-contain rounded-2xl transition duration-300 group-hover:scale-105"
              />
              {page.offer?.enabled && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] md:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                  {page.offer.discountText || "Special Offer"}
                </div>
              )}
            </div>
          </div>

          {/* Right / Content */}
          <div className="lg:col-span-6 space-y-5 order-2 lg:order-1">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                <FiZap /> Limited Time Offer
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight">
                {page.hero?.headline || page.title}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed pt-1">
                {page.hero?.subHeadline ||
                  page.description ||
                  "এই পণ্যটি আপনার দৈনন্দিন ব্যবহারের জন্য একটি প্রিমিয়াম ও টেকসই পণ্য।"}
              </p>
            </div>

            {/* Offer Box */}
            {page.offer?.enabled && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 md:p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900/80 font-semibold block">অফার প্রাইস</span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-black text-rose-600">
                      ৳{page.offer.offerPrice}
                    </span>
                    {page.offer.oldPrice && (
                      <span className="text-slate-400 line-through text-base md:text-lg font-semibold">
                        ৳{page.offer.oldPrice}
                      </span>
                    )}
                  </div>
                </div>
                {page.offer.discountText && (
                  <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {page.offer.discountText}
                  </span>
                )}
              </div>
            )}

            {/* Trust Micro-Bullets */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <FiCheckCircle className="text-emerald-500 text-base shrink-0" />
                <span>১০০% অথেনটিক কোয়ালিটি</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <FiTruck className="text-indigo-500 text-base shrink-0" />
                <span>হোম ডেলিভারি সুবিধা</span>
              </div>
            </div>

            {/* Action CTA */}
            <button
              onClick={() => {
                document.getElementById("checkout").scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-base md:text-lg py-4 px-8 rounded-2xl shadow-xl shadow-rose-200 text-center flex items-center justify-center gap-3 transition"
            >
              <FiShoppingCart className="text-xl" />
              <span>১-ক্লিকে এখনই অর্ডার করুন</span>
            </button>
          </div>
        </section>

        {/* 4. VIDEO SECTION */}
        {page.video?.enabled && page.video?.url && (
          <section className="bg-white rounded-3xl p-5 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                প্রোডাক্ট পরিচিতি ভিডিও
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                বিস্তারিত ব্যবহারবিধি ও কোয়ালিটি ভিডিওতে দেখে নিন
              </p>
            </div>

            <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200">
              <iframe
                className="w-full h-full"
                src={page.video.url.replace("watch?v=", "embed/").split("&")[0]}
                title="Product Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* 5. BENEFITS */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-xl md:text-2xl font-black text-center text-slate-900">
            আমাদের পণ্যটি কেন পছন্দ করবেন?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "প্রিমিয়াম কোয়ালিটি",
                desc: "১০০% অরিজিনাল ও দীর্ঘস্থায়ী প্রোডাক্ট নিশ্চয়তা।",
                icon: <FiShield className="text-emerald-500 text-2xl" />,
              },
              {
                title: "দ্রুত ডেলিভারি",
                desc: "সারা দেশে নিরাপদে পণ্য পৌঁছানোর বিশ্বস্ত সেবা।",
                icon: <FiTruck className="text-indigo-500 text-2xl" />,
              },
              {
                title: "ক্যাশ অন ডেলিভারি",
                desc: "পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা।",
                icon: <FiCheckCircle className="text-amber-500 text-2xl" />,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CHECKOUT SECTION */}
        <section
          id="checkout"
          className="bg-white border-2 border-rose-500/90 rounded-3xl p-5 md:p-10 shadow-xl scroll-mt-20 space-y-8"
        >
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-rose-600">
              অর্ডার সম্পন্ন করুন
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              সঠিক নাম, ঠিকানা ও মোবাইল নম্বর দিয়ে নিচের ফর্মটি পূরণ করুন
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Customer Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const orderPayload = {
                  cartItems: [
                    {
                      productId: product._id,
                      quantity: Number(quantity),
                    },
                  ],
                  shippingOption: "inside",
                  paymentMethod,
                  manualPayment:
                    paymentMethod === "cod"
                      ? null
                      : {
                          provider: paymentMethod,
                          senderNumber: orderForm.senderNumber,
                          transactionId: orderForm.transactionId,
                        },
                  customer: {
                    name: orderForm.name,
                    mobile: orderForm.mobile,
                  },
                  address: `${orderForm.upazila}, ${orderForm.address}`,
                  district: orderForm.district,
                };

                console.log(orderPayload);
                /*
                await axiosSecure.post("/api/order", orderPayload);
                */
                alert("ধন্যবাদ! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।");
              }}
              className="lg:col-span-7 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  আপনার নাম *
                </label>
                <input
                  required
                  name="name"
                  placeholder="সম্পূর্ণ নাম লিখুন"
                  value={orderForm.name}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  মোবাইল নম্বর *
                </label>
                <input
                  required
                  type="tel"
                  name="mobile"
                  placeholder="১১ ডিজিটের মোবাইল নম্বর"
                  value={orderForm.mobile}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      mobile: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    জেলা *
                  </label>
                  <select
                    required
                    value={orderForm.district}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        district: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition"
                  >
                    <option value="">জেলা নির্বাচন করুন</option>
                    <option>ঢাকা</option>
                    <option>চট্টগ্রাম</option>
                    <option>রাজশাহী</option>
                    <option>খুলনা</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    উপজেলা / থানা *
                  </label>
                  <select
                    required
                    value={orderForm.upazila}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        upazila: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition"
                  >
                    <option value="">উপজেলা নির্বাচন করুন</option>
                    <option>গুলশান</option>
                    <option>মিরপুর</option>
                    <option>উত্তরা</option>
                    <option>ধানমন্ডি</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  সম্পূর্ণ ঠিকানা *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="বাসা নং, রোড নং, এলাকা বা গ্রামের নাম"
                  value={orderForm.address}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      address: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition"
                />
              </div>

              {/* PAYMENT SECTION */}
              <div className="pt-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                  পেমেন্ট পদ্ধতি নির্বাচন করুন
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`border-2 rounded-2xl p-3.5 cursor-pointer flex items-center gap-3 transition ${
                      paymentMethod === "cod"
                        ? "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs md:text-sm">Cash On Delivery</span>
                  </label>

                  <label
                    className={`border-2 rounded-2xl p-3.5 cursor-pointer flex items-center gap-3 transition ${
                      paymentMethod === "bkash"
                        ? "border-pink-500 bg-pink-50/60 text-pink-950 font-bold"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "bkash"}
                      onChange={() => setPaymentMethod("bkash")}
                      className="text-pink-600 focus:ring-pink-500"
                    />
                    <span className="text-xs md:text-sm">bKash Payment</span>
                  </label>

                  <label
                    className={`border-2 rounded-2xl p-3.5 cursor-pointer flex items-center gap-3 transition ${
                      paymentMethod === "nagad"
                        ? "border-orange-500 bg-orange-50/60 text-orange-950 font-bold"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "nagad"}
                      onChange={() => setPaymentMethod("nagad")}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-xs md:text-sm">Nagad Payment</span>
                  </label>
                </div>
              </div>

              {/* Manual Mobile Payment Details */}
              {paymentMethod !== "cod" && (
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-2">
                  <p className="text-xs font-bold text-slate-700">
                    {paymentMethod === "bkash"
                      ? "📌 বিকাশ সেন্ড মানি নম্বর: 01XXXXXXXXX"
                      : "📌 নগদ সেন্ড মানি নম্বর: 01XXXXXXXXX"}
                  </p>

                  <input
                    required
                    placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন"
                    value={orderForm.senderNumber}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        senderNumber: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none"
                  />

                  <input
                    required
                    placeholder="Transaction ID (TrxID)"
                    value={orderForm.transactionId}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        transactionId: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-rose-500 outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-98 text-white py-4 rounded-2xl font-black text-base md:text-lg shadow-xl shadow-rose-200 transition"
              >
                ✅ ৳{total} দিয়ে অর্ডার নিশ্চিত করুন
              </button>
            </form>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200/80 p-5 md:p-6 h-fit space-y-5">
              <h2 className="text-lg font-black text-slate-900 border-b pb-3">
                অর্ডার সারাংশ
              </h2>

              {/* Product mini card */}
              <div className="flex items-center gap-3.5 bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <img
                  src={product?.productImage?.[0] || page.hero?.image}
                  alt={product?.productName}
                  className="w-16 h-16 rounded-xl object-cover border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-800 truncate">
                    {product?.productName || page.title}
                  </h3>
                  <p className="text-rose-600 font-black text-base mt-0.5">
                    ৳{price}
                  </p>
                </div>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <span className="text-xs md:text-sm font-semibold text-slate-600">পরিমাণ (Quantity)</span>

                <div className="flex items-center border rounded-lg overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition"
                  >
                    <FiMinus className="text-xs" />
                  </button>

                  <span className="px-3 text-sm font-bold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition"
                  >
                    <FiPlus className="text-xs" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Rows */}
              <div className="space-y-2.5 bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>পণ্যের মূল্য:</span>
                  <span className="font-semibold">৳{price * quantity}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-semibold">৳{deliveryCharge}</span>
                </div>

                <div className="border-t pt-2.5 flex justify-between font-black text-base md:text-lg text-slate-900">
                  <span>মোট বিল:</span>
                  <span className="text-rose-600">৳{total}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                * কোনো অগ্রিম ফি ছাড়াই পণ্য দেখে ক্যাশ অন ডেলিভারিতে নিতে পারবেন
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* 7. MOBILE STICKY FLOATING BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-2xl border-t p-3 md:hidden flex justify-between items-center z-50">
        <div>
          <p className="text-[11px] text-slate-500 font-medium">মোট প্রদেয়</p>
          <p className="font-black text-lg text-rose-600 leading-none">
            ৳{total}
          </p>
        </div>

        <button
          onClick={() => {
            document.getElementById("checkout").scrollIntoView({
              behavior: "smooth",
            });
          }}
          className="bg-rose-600 active:scale-95 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-rose-200"
        >
          অর্ডার করুন 🛒
        </button>
      </div>

    </div>
  );
};

export default LandingPageView;