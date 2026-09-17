import React, { useEffect, useState } from "react";
import {
  Ticket,
  CheckCircle,
  PauseCircle,
  Clock,
  Plus,
  Trash2,
  Search,
  SlidersHorizontal,
  Percent,
  DollarSign,
  PlayCircle,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";

const token = localStorage.getItem("token") || sessionStorage.getItem("token");
const BASE = import.meta.env.VITE_APP_SERVER_URL;

export default function AdminCoupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    code: "",
    type: "percent", // percent | fixed
    amount: 0,
    minSpend: 0,
    status: "active",
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}api/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}api/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          appliesTo: { kind: "all" },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed");
      setForm({
        code: "",
        type: "percent",
        amount: 0,
        minSpend: 0,
        status: "active",
      });
      await load();
      toast.success("🎉 Coupon created successfully!", {
        position: "top-right",
      });
    } catch (e) {
      toast.error(`❌ ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

const del = async (id) => {
  const result = await Swal.fire({
    title: "Delete Coupon?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: "rounded-3xl",
      confirmButton: "rounded-xl",
      cancelButton: "rounded-xl",
    },
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`${BASE}api/admin/coupons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete coupon");
    }

    toast.success("🗑️ Coupon deleted successfully!", {
      position: "top-right",
      autoClose: 2500,
    });

    await load();
  } catch (error) {
    toast.error(`❌ ${error.message}`, {
      position: "top-right",
      autoClose: 3000,
    });
  }
};

const setStatus = async (id, status) => {
  try {
    const res = await fetch(`${BASE}api/admin/coupons/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to update status");
    }

    toast.success(
      status === "active"
        ? "✅ Coupon activated"
        : "⏸️ Coupon paused",
      {
        position: "top-right",
        autoClose: 2000,
      }
    );

    await load();
  } catch (error) {
    toast.error(`❌ ${error.message}`);
  }
};
  // Stats calculation
  const totalCoupons = items.length;
  const activeCoupons = items.filter((c) => c.status === "active").length;
  const pausedCoupons = items.filter((c) => c.status === "paused").length;
  const expiredCoupons = items.filter((c) => c.status === "expired").length;

  // Filter items based on search
  const filteredItems = items.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen w-full font-sans text-slate-800">
      {/* Header section as seen in 03058705-6f6c-4f03-ada2-76ba0975bbfd.png */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Coupon Management
            </h1>
            <p className="text-sm text-slate-500">
              Create and manage promotional discounts for your customers.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            document
              .getElementById("coupon-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Create New Coupon
        </button>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Coupons
            </p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              {totalCoupons}
            </h3>
            <p className="text-xs text-slate-400 mt-1">All time coupons</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Coupons
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {activeCoupons}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Currently active</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Paused Coupons
            </p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">
              {pausedCoupons}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Temporarily paused</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Expired Coupons
            </p>
            <h3 className="text-2xl font-bold text-rose-500 mt-1">
              {expiredCoupons}
            </h3>
            <p className="text-xs text-slate-400 mt-1">No longer valid</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create Coupon Form */}
        <div
          id="coupon-form"
          className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Create New Coupon
              </h3>
              <p className="text-xs text-slate-400">
                Add a new coupon for your customers
              </p>
            </div>
          </div>

          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Coupon Code
              </label>
              <input
                type="text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="e.g. MM20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Type
                </label>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50 appearance-none"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed (৳)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                    }
                    min="0"
                    required
                  />
                  <div className="absolute left-3 top-3 text-slate-400">
                    {form.type === "percent" ? (
                      <Percent className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-xs font-bold">৳</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Min Spend (৳)
              </label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                value={form.minSpend}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minSpend: Number(e.target.value) }))
                }
                placeholder="Minimum order amount"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Minimum order amount to use this coupon
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Status
              </label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <button
              disabled={saving}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-50 transition-all"
            >
              <Plus className="w-4 h-4" />{" "}
              {saving ? "Saving..." : "Create Coupon"}
            </button>
          </form>
        </div>

        {/* Right Side: Existing Coupons List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter and Search Section */}
          <div className="bg-white p-4 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Existing Coupons
              </h3>
              <p className="text-xs text-slate-400">
                Manage and monitor all your coupons
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Search coupons..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:border-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>

          {/* Coupons Card Container */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              Loading coupons…
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((c) => {
                const isActive = c.status === "active";
                const isPaused = c.status === "paused";
                const isExpired = c.status === "expired";

                // Color codes dynamically based on status matching 03058705-6f6c-4f03-ada2-76ba0975bbfd.png
                let statusColor = "bg-slate-100 text-slate-700";
                let sideBorder = "border-l-slate-400";
                let ticketBg = "bg-slate-50";
                if (isActive) {
                  statusColor = "bg-emerald-50 text-emerald-600";
                  sideBorder = "border-l-indigo-500"; // unique left accent line
                  ticketBg = "bg-indigo-50/40";
                } else if (isPaused) {
                  statusColor = "bg-amber-50 text-amber-600";
                  sideBorder = "border-l-amber-500";
                  ticketBg = "bg-amber-50/40";
                } else if (isExpired) {
                  statusColor = "bg-rose-50 text-rose-600";
                  sideBorder = "border-l-rose-500";
                  ticketBg = "bg-rose-50/40";
                }

                return (
                  <div
                    key={c._id}
                    className={`bg-white border border-slate-100 border-l-4 ${sideBorder} rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md`}
                  >
                    {/* Left: Coupon Visual Ticket and Title */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      {/* Ticket Badge Design */}
                      <div
                        className={`w-24 h-20 shrink-0 ${ticketBg} rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 relative overflow-hidden`}
                      >
                        <div className="absolute -left-1.5 w-3 h-3 bg-white border border-slate-100 rounded-full"></div>
                        <div className="absolute -right-1.5 w-3 h-3 bg-white border border-slate-100 rounded-full"></div>
                        <span className="text-sm font-black text-slate-800 tracking-wide uppercase">
                          {c.code}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-0.5 rounded shadow-sm mt-1">
                          CODE
                        </span>
                      </div>

                      {/* Coupon Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-slate-800">
                            {c.type === "percent"
                              ? `${c.amount}% OFF`
                              : `৳${c.amount} OFF`}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusColor} capitalize`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          Get{" "}
                          {c.type === "percent"
                            ? `${c.amount}%`
                            : `৳${c.amount}`}{" "}
                          off on orders above ৳{c.minSpend || 0}
                        </p>

                        {/* Meta Tags like image */}
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 font-medium pt-1">
                          <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            Min Spend: ৳{c.minSpend || 0}
                          </span>
                          <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100 capitalize">
                            Type: {c.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions Block matching the picture layout */}
                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 md:text-right">
                        Used 0 times
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Toggle Status Buttons: Pause or Activate */}
                        {isActive ? (
                          <button
                            onClick={() => setStatus(c._id, "paused")}
                            title="Pause Coupon"
                            className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-100 transition-colors"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatus(c._id, "active")}
                            title="Activate Coupon"
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-100 transition-colors"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => del(c._id)}
                          title="Delete Coupon"
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!filteredItems.length && (
                <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  No coupons found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      <ToastContainer />
    </div>
  );
}
