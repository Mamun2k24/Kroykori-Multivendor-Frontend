import React, { lazy, Suspense, useEffect, useState } from "react";
import axios from "axios";
import {
  FiDownload,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiUsers,
} from "react-icons/fi";
import {
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineReceiptTax,
} from "react-icons/hi";
import { toast, ToastContainer } from "react-toastify";

const SalesOverviewChart = lazy(() => import("./SalesOverviewChart"));
const BDT = (n) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const API = (import.meta.env.VITE_APP_SERVER_URL || "").replace(/\/$/, "");
const auth = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});
const dateLabel = (value) =>
  value?.length === 7
    ? new Date(`${value}-01T00:00:00`).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

export default function SalesReport() {
  const [filters, setFilters] = useState({
    from: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    status: "delivered",
    paymentStatus: "all",
    groupBy: "day",
  });
  const [data, setData] = useState({
    summary: {},
    rows: [],
    topProducts: [],
    paymentMethods: [],
  });
  const [loading, setLoading] = useState(true);
  const change = (key) => (e) =>
    setFilters((old) => ({ ...old, [key]: e.target.value }));

  const fetchReport = async () => {
    if (filters.from > filters.to)
      return toast.error("From date cannot be after To date");
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/reports/sales`, {
        headers: auth(),
        params: filters,
      });
      setData(res.data || { summary: {}, rows: [] });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load sales report",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReport();
  }, []);

  const exportCSV = () => {
    if (!data.rows?.length) return toast.info("No data to export");
    const lines = [
      [
        "Period",
        "Orders",
        "Items",
        "Customers",
        "Shipping",
        "Discount",
        "Net Sales",
        "Gross Sales",
      ],
      ...data.rows.map((r) => [
        r.period,
        r.orders,
        r.itemsSold,
        r.uniqueCustomers,
        r.shipping,
        r.discount,
        r.netSales,
        r.grossSales,
      ]),
    ];
    const csv =
      "\uFEFF" +
      lines
        .map((row) =>
          row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${filters.from}-${filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = data.summary || {};
  const cards = [
    ["Total Orders", s.orders || 0, <FiShoppingBag />, "indigo"],
    ["Gross Sales", BDT(s.grossSales), <HiOutlineCash />, "emerald"],
    ["Net Sales", BDT(s.netSales), <HiOutlineChartBar />, "blue"],
    ["Shipping", BDT(s.shipping), <FiTruck />, "amber"],
    ["Discount", BDT(s.discount), <HiOutlineReceiptTax />, "rose"],
    ["Avg. Order", BDT(s.averageOrderValue), <FiUsers />, "violet"],
  ];

  return (
    <main className="w-full min-w-0 max-w-full overflow-x-hidden px-1 pb-8 pt-2 text-slate-800">
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Sales Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track revenue, orders and product performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Action
            onClick={fetchReport}
            disabled={loading}
            icon={<FiRefreshCw className={loading ? "animate-spin" : ""} />}
            label={loading ? "Loading..." : "Refresh"}
          />
          <Action
            onClick={exportCSV}
            disabled={loading || !data.rows?.length}
            icon={<FiDownload />}
            label="Export CSV"
          />
        </div>
      </header>

      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
          <Field label="From">
            <input
              type="date"
              value={filters.from}
              onChange={change("from")}
              className="input"
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={filters.to}
              onChange={change("to")}
              className="input"
            />
          </Field>
          <Field label="Order Status">
            <select
              value={filters.status}
              onChange={change("status")}
              className="input"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Payment">
            <select
              value={filters.paymentStatus}
              onChange={change("paymentStatus")}
              className="input"
            >
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
            </select>
          </Field>
          <Field label="Group By">
            <select
              value={filters.groupBy}
              onChange={change("groupBy")}
              className="input"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </Field>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="mt-auto h-11 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value, icon, tone]) => (
          <SummaryCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            tone={tone}
          />
        ))}
      </section>

      <section className="mb-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-black text-slate-900">Sales Overview</h2>
          <p className="mb-4 text-xs text-slate-500">
            Gross sales by {filters.groupBy}
          </p>
          {data.rows?.length ? (
            <Suspense
              fallback={
                <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
              }
            >
              <SalesOverviewChart data={data.rows} />
            </Suspense>
          ) : (
            <Empty />
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-black text-slate-900">Top Products</h2>
          <p className="mb-4 text-xs text-slate-500">
            Best sellers in selected period
          </p>
          <div className="space-y-2">
            {data.topProducts?.length ? (
              data.topProducts.map((p, i) => (
                <div
                  key={p.productId || i}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-xs font-black text-indigo-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {p.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.quantity} items sold
                    </p>
                  </div>
                  <p className="text-sm font-black">{BDT(p.sales)}</p>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </div>
        </div>
      </section>

      <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-black">Sales Breakdown</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {[
                  "Period",
                  "Orders",
                  "Items",
                  "Customers",
                  "Shipping",
                  "Discount",
                  "Net Sales",
                  "Gross Sales",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows?.map((r) => (
                <tr key={r.period} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">{dateLabel(r.period)}</td>
                  <td className="px-4 py-3">{r.orders}</td>
                  <td className="px-4 py-3">{r.itemsSold}</td>
                  <td className="px-4 py-3">{r.uniqueCustomers}</td>
                  <td className="px-4 py-3">{BDT(r.shipping)}</td>
                  <td className="px-4 py-3">{BDT(r.discount)}</td>
                  <td className="px-4 py-3 font-semibold">{BDT(r.netSales)}</td>
                  <td className="px-4 py-3 font-black text-slate-900">
                    {BDT(r.grossSales)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.rows?.length && <Empty />}
        </div>
      </section>
      <ToastContainer position="top-center" autoClose={1200} hideProgressBar />
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-slate-500">
      {label}
      {React.cloneElement(children, {
        className:
          "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100",
      })}
    </label>
  );
}
function Action({ icon, label, ...props }) {
  return (
    <button
      {...props}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}
function SummaryCard({ label, value, icon, tone }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 grid h-9 w-9 place-items-center rounded-xl text-lg ${colors[tone]}`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-black text-slate-900">{value}</p>
    </article>
  );
}
function Empty() {
  return (
    <div className="grid min-h-28 place-items-center text-sm text-slate-400">
      No data found for this filter.
    </div>
  );
}
