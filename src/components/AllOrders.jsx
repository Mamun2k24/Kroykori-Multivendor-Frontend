import React, { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import {
  FiSearch,
  FiRefreshCw,
  FiPackage,
  FiDollarSign,
  FiPhone,
  FiMapPin,
  FiClock,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiUser,
  FiTrendingUp,
  FiTruck,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiBookmark,
  FiCalendar,
} from "react-icons/fi";

const orderStatusBadgeClass = (s = "") => {
  const v = String(s || "").toLowerCase();
  if (v === "pending") return "bg-amber-50 text-amber-700 border border-amber-200/60";
  if (v === "processing") return "bg-purple-50 text-purple-700 border border-purple-200/60";
  if (v === "confirmed") return "bg-blue-50 text-blue-700 border border-blue-200/60";
  if (v === "delivered") return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
  if (v === "cancelled") return "bg-rose-50 text-rose-700 border border-rose-200/60";
  return "bg-slate-50 text-slate-700 border border-slate-200";
};

const paymentBadgeClass = (s = "") => {
  const v = String(s || "").toLowerCase();
  if (v === "paid") return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
  if (v === "partial") return "bg-indigo-50 text-indigo-700 border border-indigo-200/60";
  if (v === "refunded") return "bg-rose-50 text-rose-700 border border-rose-200/60";
  return "bg-amber-50 text-amber-700 border border-amber-200/60";
};

const fmtBDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const fmtBDDateTime = (d) =>
  d
    ? new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Dhaka",
      }).format(new Date(d))
    : "—";

const getBaseUrl = () => {
  const base = import.meta.env.VITE_APP_SERVER_URL || "";
  return base.endsWith("/") ? base : `${base}/`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [metaSummary, setMetaSummary] = useState({ totalSales: 0, uniqueCustomers: 0, itemsSold: 0 });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, limit]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = getBaseUrl();
      const res = await axios.get(`${url}api/orders?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders(),
      });

      const receivedItems = res.data?.items || res.data?.orders || (Array.isArray(res.data) ? res.data : []);
      const totalCount = res.data?.total !== undefined ? res.data.total : (res.data?.count || receivedItems.length);

      setOrders(receivedItems);
      setTotalOrdersCount(totalCount);

      setMetaSummary({
        totalSales: res.data?.metaSummary?.totalSales || res.data?.totalSales || 0,
        uniqueCustomers: res.data?.metaSummary?.uniqueCustomers || res.data?.uniqueCustomers || 0,
        itemsSold: res.data?.metaSummary?.itemsSold || res.data?.itemsSold || 0
      });

    } catch (err) {
      console.error("fetchOrders error:", err);
      toast.error(err?.response?.data?.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;

    return orders.filter((o) => {
      const customerName = String(o?.customer?.name || "").toLowerCase();
      const mobile = String(o?.customer?.mobile || "").toLowerCase();
      const addr = String(o?.address || "").toLowerCase();
      const products = (o?.products || [])
        .map((p) => `${p?.product?.productName || ""} ${p?.product?.sku || ""}`)
        .join(" ")
        .toLowerCase();
      const orderType = String(o?.orderType || "").toLowerCase();

      return (
        customerName.includes(s) ||
        mobile.includes(s) ||
        addr.includes(s) ||
        products.includes(s) ||
        orderType.includes(s)
      );
    });
  }, [orders, q]);

  const stats = useMemo(() => {
    const amount = metaSummary.totalSales || orders.reduce((sum, o) => sum + (Number(o?.totalPrice) || 0), 0);
    const customers = metaSummary.uniqueCustomers || new Set(orders.map((o) => o?.customer?.mobile || "")).size;
    const qty = metaSummary.itemsSold || orders.reduce((sum, o) => sum + (o.products || []).reduce((s, it) => s + (Number(it?.quantity) || 0), 0), 0);

    return {
      orderCount: totalOrdersCount || orders.length,
      totalAmount: amount,
      uniqueCustomers: customers,
      itemsSold: qty,
    };
  }, [orders, totalOrdersCount, metaSummary]);

  const totalPages = Math.max(1, Math.ceil(stats.orderCount / limit));
  const startIndex = stats.orderCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, stats.orderCount);

  const openDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedOrder(null);
  };

  const confirmOrder = async (orderId) => {
    try {
      setBusyId(orderId);
      const url = getBaseUrl();
      await axios.put(`${url}api/order/${orderId}`, { orderStatus: "processing" }, { headers: getAuthHeaders() });
      toast.success("Order confirmed (processing)");
      await fetchOrders();
      closeDetails();
    } catch (e) {
      toast.error("Failed to confirm order");
    } finally {
      setBusyId(null);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      setBusyId(orderId);
      const url = getBaseUrl();
      await axios.delete(`${url}api/order/${orderId}`, { headers: getAuthHeaders() });
      toast.success("Order cancelled");
      await fetchOrders();
      closeDetails();
    } catch (e) {
      toast.error("Failed to cancel order");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-1 py-4 bg-slate-50 min-h-screen w-full font-sans text-slate-800 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40" />

      {/* 1. Header Section */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-poppins">All Orders</h1>
          <p className="text-sm text-slate-500">Manage, verify and monitor every retail pipeline transaction.</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search orders (or 'pre_book')..."
              className="w-full lg:w-80 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <button
            onClick={() => { setPage(1); fetchOrders(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 shadow-sm"
          >
            <FiRefreshCw className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2. Top Analytics Counters */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={<FiPackage />} label="Total Orders" value={stats.orderCount.toLocaleString()} subtitle="All time conversions" color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={<FiDollarSign />} label="Total Sales" value={fmtBDT(stats.totalAmount)} subtitle="+18.3% vs yesterday" trend={true} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={<FiUser />} label="Total Customers" value={stats.uniqueCustomers.toLocaleString()} subtitle="Unique interaction list" color="bg-sky-50 text-sky-600" />
        <StatCard icon={<FiActivity />} label="Items Sold" value={stats.itemsSold.toLocaleString()} subtitle="Accumulated item quantity" color="bg-purple-50 text-purple-600" />
      </div>

      {/* 3. Main Data Table Frame */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs font-medium">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Customer Details</th>
                <th className="px-6 py-4 text-left">Product View</th>
                <th className="px-6 py-4 text-left">SKU</th>
                <th className="px-6 py-4 text-center">Qty</th>
                <th className="px-6 py-4 text-left">Amount</th>
                <th className="px-6 py-4 text-center">Order Status</th>
                <th className="px-6 py-4 text-center">Payment</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-semibold animate-pulse">
                    Syncing live database stream...
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((order) =>
                  (order.products || []).map((item, pi) => {
                    const pStatus = (order?.paymentStatus || "unpaid").toLowerCase();
                    const oStatus = (order?.orderStatus || "pending").toLowerCase();
                    const showActionOnce = pi === 0;
                    const productImg = item?.product?.productImage?.[0] || item?.product?.productImage || null;
                    
                    // Pre-book detection
                    const isPreBook = order?.orderType === "pre_book" || Boolean(item?.product?.preBook?.enabled);

                    return (
                      <tr 
                        key={`${order._id}-${pi}`} 
                        className={`transition-colors ${
                          isPreBook 
                            ? "bg-blue-50/25 hover:bg-blue-50/50 border-l-4 border-l-blue-500" 
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="px-6 py-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{order?.customer?.name || "Guest User"}</p>
                              {isPreBook && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black px-1.5 py-0.5 border border-blue-200">
                                  <FiBookmark className="w-2.5 h-2.5" /> Pre-order
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                              <FiPhone className="w-3 h-3 text-slate-300" /> {order?.customer?.mobile || "N/A"}
                            </div>
                            <div className="text-[11px] text-slate-400 max-w-[220px] truncate flex items-center gap-1">
                              <FiMapPin className="w-3 h-3 text-slate-300 shrink-0" /> {order?.address || "—"}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                              {productImg ? (
                                <img src={productImg} alt="" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <FiPackage className="text-slate-300 w-4 h-4" />
                              )}
                            </div>
                            <div className="max-w-[180px]">
                              <p className="font-bold text-slate-800 line-clamp-1">{item?.product?.productName || "N/A"}</p>
                              <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center gap-1">
                                <FiClock className="w-2.5 h-2.5" /> {fmtBDDateTime(order?.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle text-slate-400 font-mono font-semibold">{item?.product?.sku || "—"}</td>
                        <td className="px-6 py-4 align-middle text-center font-bold text-slate-800">{item?.quantity || 0}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold">{fmtBDT(item?.finalPrice || item?.price)}</div>
                            {(item?.discountAmount || 0) > 0 && (
                              <div className="text-[10px] text-green-600">Save {fmtBDT(item?.discountAmount)}</div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${orderStatusBadgeClass(oStatus)}`}>
                            {oStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${paymentBadgeClass(pStatus)}`}>
                            {pStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle text-right">
                          {showActionOnce ? (
                            <button
                              onClick={() => openDetails(order)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-slate-600 font-bold shadow-sm transition-colors"
                            >
                              <FiEye className="text-indigo-600 w-3.5 h-3.5" /> View
                            </button>
                          ) : (
                            <span className="text-transparent select-none">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}

              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <FiPackage className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No retail dashboard orders matching active query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. SMART PAGINATION CONTROL SYSTEM */}
        {stats.orderCount > 0 && (
          <div className="bg-slate-50/70 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs font-bold text-slate-500">
            <div>
              Showing <span className="text-slate-800">{startIndex}</span>–
              <span className="text-slate-800">{endIndex}</span> of{" "}
              <span className="text-slate-800">{stats.orderCount}</span> orders
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-slate-400">
                <span>Rows:</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} 
                  className="bg-transparent outline-none text-slate-800 font-extrabold cursor-pointer"
                >
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>

              <nav className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm" aria-label="Pagination">
                <button 
                  className="p-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30 text-slate-600 transition-colors" 
                  onClick={() => setPage(1)} 
                  disabled={page === 1 || loading}
                >
                  <FiChevronsLeft className="w-4 h-4" />
                </button>
                <button 
                  className="p-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30 text-slate-600 transition-colors" 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1 || loading}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 text-slate-700 font-bold">
                  Page {page} / {totalPages}
                </span>

                <button 
                  className="p-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30 text-slate-600 transition-colors" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages || loading}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
                <button 
                  className="p-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30 text-slate-600 transition-colors" 
                  onClick={() => setPage(totalPages)} 
                  disabled={page === totalPages || loading}
                >
                  <FiChevronsRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          busy={busyId === selectedOrder._id}
          onClose={closeDetails}
          onConfirm={() => confirmOrder(selectedOrder._id)}
          onCancel={() => cancelOrder(selectedOrder._id)}
          fmtBDT={fmtBDT}
          fmtBDDateTime={fmtBDDateTime}
        />
      )}

      <ToastContainer position="top-center" autoClose={900} hideProgressBar />
    </div>
  );
};

function StatCard({ icon, label, value, subtitle, trend = false, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{value}</h3>
        <p className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${trend ? "text-emerald-600" : "text-slate-400"}`}>
          {trend && <FiTrendingUp className="w-3 h-3" />} {subtitle}
        </p>
      </div>
      <div className={`p-3.5 rounded-xl shadow-inner ${color}`}>
        <span className="text-xl stroke-[2.5]">{icon}</span>
      </div>
    </div>
  );
}

function OrderDetailsModal({ order, busy, onClose, onConfirm, onCancel, fmtBDT, fmtBDDateTime }) {
  const productTotal = (order.products || []).reduce((s, it) => s + (Number(it?.price) || 0) * (Number(it?.quantity) || 0), 0);
  const status = String(order?.orderStatus || "pending").toLowerCase();
  const canConfirm = status === "pending";
  const canCancel = status === "pending" || status === "processing";
  const isOrderPreBook = order?.orderType === "pre_book";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 transform transition-all flex flex-col font-sans max-h-[88vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Order Details Workspace</h3>
              {isOrderPreBook && (
                <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5">
                  Pre-order
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Unique ID: <span className="font-mono text-indigo-600 font-bold">{order?._id}</span></p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600"><FiX className="w-4 h-4 stroke-[2.5]" /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Profile</p>
              <p className="font-black text-slate-800 text-sm flex items-center gap-1.5"><FiUser className="text-slate-400 w-3.5 h-3.5" /> {order?.customer?.name || "—"}</p>
              <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5"><FiPhone className="text-slate-400 w-3.5 h-3.5" /> {order?.customer?.mobile || "—"}</p>
              <p className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5"><FiClock className="text-slate-400 w-3.5 h-3.5" /> Created: {fmtBDDateTime(order?.createdAt)}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Logistics Shipping</p>
              <p className="text-xs text-slate-700 font-semibold flex items-center gap-1.5"><FiTruck className="text-slate-400 w-3.5 h-3.5" /> Option: <span className="font-bold text-slate-900 ml-1">{order?.shippingOption || "—"}</span></p>
              <p className="text-xs text-slate-700 font-semibold flex items-center gap-1.5"><FiDollarSign className="text-slate-400 w-3.5 h-3.5" /> Charge: <span className="font-bold text-slate-900 ml-1">{fmtBDT(order?.shippingCost || 0)}</span></p>
              <p className="text-[11px] text-slate-500 font-medium pt-1 flex items-start gap-1.5"><FiMapPin className="text-slate-400 w-3.5 h-3.5 mt-0.5 shrink-0" /> Destination: {order?.address || "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Ordered Items Queue</div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {(order.products || []).map((it, idx) => {
                const name = it?.product?.productName || "N/A";
                const img = it?.product?.productImage?.[0] || it?.product?.productImage || null;
                const qty = Number(it?.quantity) || 0;
                const unit = Number(it?.price) || 0;
                const expectedDelivery = it?.product?.preBook?.expectedDeliveryDate;

                return (
                  <div key={idx} className="p-3.5 flex gap-3 items-center bg-white">
                    <div className="h-11 w-11 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden grid place-items-center shrink-0">
                      {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <FiPackage className="text-slate-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 text-xs truncate">{name}</p>
                      {expectedDelivery && (
                        <p className="text-[10px] font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="w-2.5 h-2.5" /> Delivery: {new Date(expectedDelivery).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">Original: {fmtBDT(it?.originalPrice || unit)}</p>
                      {(it?.discountAmount || 0) > 0 && <p className="text-[11px] text-green-600">Discount: -{fmtBDT(it?.discountAmount)}</p>}
                      <p className="text-[11px] font-bold text-slate-700">Final: {fmtBDT(it?.finalPrice || unit)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 font-bold">Subtotal</p>
                      <p className="font-black text-slate-800 text-xs">{fmtBDT(qty * unit)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              Pipeline Stage: <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-md uppercase text-[10px] font-black border border-indigo-100">{order?.orderStatus || "pending"}</span>
            </div>
            <div className="w-full sm:w-60 space-y-1.5 text-xs font-bold text-slate-400 text-right">
              <div className="flex justify-between"><span>Items Subtotal:</span><span className="text-slate-700 font-black">{fmtBDT(productTotal)}</span></div>
              <div className="flex justify-between"><span>Shipping Base:</span><span className="text-slate-700 font-black">{fmtBDT(order?.shippingCost || 0)}</span></div>
              {(order?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Coupon Save ({order.couponCode}):</span><span className="font-black">- {fmtBDT(order?.discountAmount || 0)}</span></div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-slate-200">
                <span className="text-slate-800 font-black text-sm">Grand Total:</span>
                <span className="text-xl font-black text-indigo-600 tracking-tight">{fmtBDT(order?.totalPrice || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 shadow-sm">Close</button>
          <button disabled={!canCancel || busy} onClick={onCancel} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 px-4 py-2 text-xs font-bold disabled:opacity-40 shadow-sm"><FiXCircle /> Cancel Order</button>
          <button disabled={!canConfirm || busy} onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold disabled:opacity-40 shadow-md shadow-indigo-100"><FiCheckCircle /> Confirm Order</button>
        </div>
      </div>
    </div>
  );
}

export default AllOrders;