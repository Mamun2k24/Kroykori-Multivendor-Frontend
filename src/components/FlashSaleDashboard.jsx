import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { toInputFormat, bdToISO } from "../utils/dateTime";
import {
  Flame,
  Plus,
  Search,
  Trash2,
  Edit3,
  PlayCircle,
  Clock,
  Eye,
  Calendar,
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_APP_SERVER_URL || ""
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const getToken = () =>
  localStorage.getItem("token");

const getAuthHeaders = (
  includeContentType = false
) => {
  const token = getToken();

  return {
    ...(includeContentType
      ? {
          "Content-Type": "application/json",
        }
      : {}),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

const getAxiosAuthConfig = () => ({
  headers: getAuthHeaders(),
});

const resolveImage = (image) => {
  if (!image) return "/placeholder.png";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return apiUrl(image);
};

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export default function FlashSaleDashboard() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [productsPriceState, setProductsPriceState] = useState({});
  const [toggleState, setToggleState] = useState({});

  const [campaignSettings, setCampaignSettings] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "active",
  });

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const { data: flashSettings } = useQuery({
    queryKey: ["flash-sale-settings"],
    queryFn: async () => {
      const res = await axios.get(
        apiUrl("/api/flashsale/settings"),
        getAxiosAuthConfig()
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (flashSettings) {
      setCampaignSettings({
        name: flashSettings.name || "",
        startDate: toInputFormat(flashSettings.startDate),
        endDate: toInputFormat(flashSettings.endDate),
        status: flashSettings.status || "active",
      });
    }
  }, [flashSettings]);

  const saveCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.put(
        apiUrl("/api/flashsale/settings"),
        {
          name: campaignSettings.name,
          startDate: bdToISO(
            campaignSettings.startDate
          ),
          endDate: bdToISO(
            campaignSettings.endDate
          ),
          status: campaignSettings.status,
        },
        getAxiosAuthConfig()
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["flash-sale-settings"],
      });

      Swal.fire({
        icon: "success",
        title: "Campaign Updated",
        timer: 1200,
        showConfirmButton: false,
      });
    },
  });

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminFlashSaleProducts"],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: "1",
        limit: "500",
        q: "",
      });

      const res = await fetch(
        apiUrl(
          `/api/products/manage/list?${params.toString()}`
        ),
        {
          signal,
          headers: getAuthHeaders(),
        }
      );

      const d = await res.json();

      if (!res.ok) {
        throw new Error(
          d?.message ||
            `Failed to sync inventory pipeline (${res.status})`
        );
      }

      const items = d?.items || d || [];

      const initialStates = {};
      items.forEach((p) => {
        if (!productsPriceState[p._id]) {
          initialStates[p._id] = {
            percent: p.flashSale?.discountPercent || 0,
            amount: p.flashSale?.discountAmount || 0,
          };
        }
      });

      if (Object.keys(initialStates).length > 0) {
        setProductsPriceState((prev) => ({ ...initialStates, ...prev }));
      }

      return items;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = String(p?.productName || "").toLowerCase();
      const sku = String(p?.sku || "").toLowerCase();

      return (
        name.includes(searchTerm.toLowerCase()) ||
        sku.includes(searchTerm.toLowerCase())
      );
    });
  }, [products, searchTerm]);

  const handlePercentChange = (id, originalPrice, percentVal) => {
    const pct = Math.min(100, Math.max(0, Number(percentVal) || 0));
    const amt = Math.round(originalPrice * (pct / 100));

    setProductsPriceState((prev) => ({
      ...prev,
      [id]: { percent: pct, amount: amt },
    }));
  };

  const handleAmountChange = (id, originalPrice, amountVal) => {
    const amt = Math.min(originalPrice, Math.max(0, Number(amountVal) || 0));
    const pct = originalPrice > 0 ? Math.round((amt / originalPrice) * 100) : 0;

    setProductsPriceState((prev) => ({
      ...prev,
      [id]: { percent: pct, amount: amt },
    }));
  };

  const toggleFlashSaleMutation = useMutation({
    mutationFn: async ({ id, isFlashSale, productPrice }) => {
      const currentPricing = productsPriceState[id] || {
        percent: 0,
        amount: 0,
      };

      const res = await fetch(
  apiUrl(
    `/api/products/${id}/flash-sale`,
  ),
  {
    method: "PATCH",
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            flashSale: {
              enabled: isFlashSale,
              discountPercent:
                currentPricing.percent,
              discountAmount:
                currentPricing.amount,
              salePrice: Math.max(
                0,
                productPrice -
                  currentPricing.amount
              ),
            },
          }),
        }
      );

      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({}));

        throw new Error(
          data?.message ||
            "Failed to update flash sale"
        );
      }

      return res.json();
    },

    onMutate: async ({ id, isFlashSale }) => {
      setToggleState((prev) => ({
        ...prev,
        [id]: isFlashSale,
      }));

      await queryClient.cancelQueries({
        queryKey: ["adminFlashSaleProducts"],
      });

      const previousProducts = queryClient.getQueryData([
        "adminFlashSaleProducts",
      ]);

      queryClient.setQueryData(["adminFlashSaleProducts"], (old = []) =>
        old.map((product) =>
          product._id === id
            ? {
                ...product,
                flashSale: {
                  ...product.flashSale,
                  enabled: isFlashSale,
                },
              }
            : product
        )
      );

      return { previousProducts };
    },

    onSuccess: (data) => {
      const updatedProduct = data?.product || data;

      if (updatedProduct?._id) {
        queryClient.setQueryData(["adminFlashSaleProducts"], (old = []) =>
          old.map((product) =>
            product._id === updatedProduct._id ? updatedProduct : product
          )
        );
      }
    },

    onError: (error, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(
          ["adminFlashSaleProducts"],
          context.previousProducts
        );
      }

      setToggleState((prev) => ({
        ...prev,
        [variables.id]: !variables.isFlashSale,
      }));

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Something went wrong",
      });
    },

    onSettled: (data, error, variables) => {
      setTimeout(() => {
        setToggleState((prev) => {
          const copy = { ...prev };
          delete copy[variables.id];
          return copy;
        });
      }, 800);
    },
  });

  useEffect(() => {
    if (!flashSettings?.endDate) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(flashSettings.endDate).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSettings?.endDate]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Synchronizing Flash Sale Core Architecture...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-rose-500 font-bold">
        Pipeline Error: {error.message}
      </div>
    );
  }

  return (
    <div className="px-0.5 my-4 bg-[#f8fafc] min-h-screen w-full font-sans text-slate-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-100">
            <Flame className="w-5 h-5 fill-current" />
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight font-poppins">
              Flash Sale Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage your flash sale products, dual-discounts, and real-time
              active timers.
            </p>
          </div>
        </div>

        <button className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-black shadow-lg shadow-indigo-100 transition-all">
          <Plus className="w-4 h-4 stroke-[2.5]" /> Create Flash Sale Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          icon={<PackageIcon />}
          label="Total Flash Sale Products"
          value={products.filter((p) => p?.flashSale?.enabled).length}
          subtitle="Products added"
          color="bg-indigo-50 text-[#4f46e5]"
        />

        <StatCard
          icon={<PlayCircle className="w-5 h-5" />}
          label="Campaign Status"
          value={campaignSettings.status}
          subtitle="Active now"
          color="bg-emerald-50 text-emerald-600"
          isStatus={true}
        />

        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Campaign Ends In"
          value={`${countdown.days}d : ${countdown.hours}h : ${countdown.minutes}m : ${countdown.seconds}s`}
          subtitle="Days   Hrs   Mins   Secs"
          color="bg-orange-50 text-orange-600"
          isTimer={true}
        />

        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Total Views"
          value="2,589"
          subtitle="From flash sale section"
          color="bg-sky-50 text-sky-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Select Products for Flash Sale
            </h3>
          </div>

          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select className="text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl font-bold text-slate-600 outline-none">
              <option>All Categories</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-10">Status</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-center w-24">
                    Discount (%)
                  </th>
                  <th className="px-4 py-3 text-center w-28">
                    Discount (৳)
                  </th>
                  <th className="px-4 py-3 text-left">Sale Price</th>
                  <th className="px-4 py-3 text-center">Flash Sale</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((product) => {
                  const hasImage =
                    product?.productImage && product.productImage.length > 0;

                  const imgUrl = hasImage
                    ? Array.isArray(product.productImage)
                      ? product.productImage[0]
                      : product.productImage
                    : "/placeholder.png";

                  const currentPricing = productsPriceState[product._id] || {
                    percent: 0,
                    amount: 0,
                  };

                  const salePrice = Math.max(
                    0,
                    product.price - currentPricing.amount
                  );

                  const isFlashEnabled =
                    toggleState[product._id] !== undefined
                      ? toggleState[product._id]
                      : product?.flashSale?.enabled || false;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isFlashEnabled}
                          readOnly
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={resolveImage(imgUrl)}
                              alt={product?.productName || "Product"}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>

                          <div className="max-w-[150px]">
                            <p className="font-bold text-slate-800 line-clamp-1 leading-snug">
                              {product?.productName}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              SKU: {product?.sku || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-500">
                        {fmtBDT(product?.price)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 max-w-[64px]">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={currentPricing.percent}
                            onChange={(e) =>
                              handlePercentChange(
                                product._id,
                                product.price,
                                e.target.value
                              )
                            }
                            className="w-full text-center bg-transparent outline-none font-bold text-slate-800 p-0 border-none text-xs"
                          />
                          <span className="text-slate-400 text-[10px] font-black">
                            %
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 max-w-[84px]">
                          <span className="text-slate-400 text-[10px] font-black">
                            ৳
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={product.price}
                            value={currentPricing.amount}
                            onChange={(e) =>
                              handleAmountChange(
                                product._id,
                                product.price,
                                e.target.value
                              )
                            }
                            className="w-full text-center bg-transparent outline-none font-bold text-slate-800 p-0 border-none text-xs"
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 font-black text-[#4f46e5]">
                        {fmtBDT(salePrice)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isFlashEnabled}
                            disabled={toggleFlashSaleMutation.isPending}
                            onChange={(e) => {
                              const checked = e.target.checked;

                              setToggleState((prev) => ({
                                ...prev,
                                [product._id]: checked,
                              }));

                              toggleFlashSaleMutation.mutate({
                                id: product._id,
                                isFlashSale: checked,
                                productPrice: product.price,
                              });
                            }}
                            className="sr-only peer"
                          />

                          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4f46e5]"></div>
                        </label>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="p-1.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button className="p-1.5 bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-600 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              {products.filter((p) => p?.flashSale?.enabled).length} of{" "}
              {products.length} products selected
            </span>

            <div className="flex gap-2">
              <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs">
                Cancel
              </button>

              <button
                onClick={() => saveCampaignMutation.mutate()}
                className="px-4 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-100"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Live Preview{" "}
                <span className="text-[10px] font-medium text-slate-400 lowercase">
                  (Home Page)
                </span>
              </h4>

              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                View All
              </span>
            </div>

            <div className="bg-gradient-to-br from-[#2e0854] to-[#4c1d95] rounded-xl p-4 text-white relative overflow-hidden shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-amber-400 text-[#2e0854] rounded-lg flex items-center justify-center shadow">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </div>

                <div className="leading-tight">
                  <h4 className="text-xs font-black uppercase tracking-wide">
                    Flash Sale
                  </h4>
                  <p className="text-[9px] text-indigo-200 font-medium">
                    Hurry up! Limited time offer
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center font-mono font-black text-sm mb-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg py-1">
                  <p>{countdown.days}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg py-1">
                  <p>{countdown.hours}</p>
                  <span className="text-[8px] font-sans text-indigo-200 uppercase font-bold tracking-tight block">
                    Hrs
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg py-1">
                  <p>{countdown.minutes}</p>
                  <span className="text-[8px] font-sans text-indigo-200 uppercase font-bold tracking-tight block">
                    Mins
                  </span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg py-1 text-amber-400">
                  <p>{countdown.seconds}</p>
                  <span className="text-[8px] font-sans text-indigo-200 uppercase font-bold tracking-tight block">
                    Secs
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-bold text-slate-400 block text-center mt-1">
              *This is how it will look on your homepage
            </span>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-2">
              Campaign Settings
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Campaign Name
                </label>

                <input
                  type="text"
                  value={campaignSettings.name}
                  onChange={(e) =>
                    setCampaignSettings({
                      ...campaignSettings,
                      name: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  Start Date & Time
                </label>

                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="datetime-local"
                    value={campaignSettings.startDate}
                    onChange={(e) =>
                      setCampaignSettings({
                        ...campaignSettings,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                  End Date & Time
                </label>

                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />

                  <input
                    type="datetime-local"
                    value={campaignSettings.endDate}
                    onChange={(e) =>
                      setCampaignSettings({
                        ...campaignSettings,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
  isTimer = false,
  isStatus = false,
}) {
  let valClass = "text-xl font-black text-slate-800 mt-1 tracking-tight";

  if (isTimer) {
    valClass =
      "text-sm sm:text-base font-mono font-black text-slate-800 mt-1 tracking-wide";
  }

  if (isStatus) {
    valClass =
      "text-xs font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-md inline-block mt-1 uppercase tracking-wider";
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
          {label}
        </p>
        <h3 className={valClass}>{value}</h3>
        <p className="text-[10px] text-slate-400 font-semibold mt-1 tracking-wide truncate">
          {subtitle}
        </p>
      </div>

      <div className={`p-3.5 rounded-xl shadow-inner shrink-0 ${color}`}>
        {icon}
      </div>
    </div>
  );
}

function PackageIcon() {
  return (
    <svg
      className="w-5 h-5 fill-none stroke-current stroke-2"
      viewBox="0 0 24 24"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}