import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiPrinter,
  FiRefreshCw,
  FiRotateCcw,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";
import { api } from "../../api/http";
import { printBrandedInvoice } from "../../utils/invoiceTemplate";

const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: FiCheckCircle,
  },
  unpaid: {
    label: "Unpaid",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    icon: FiClock,
  },
  refunded: {
    label: "Refunded",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    icon: FiRotateCcw,
  },
  partially_refunded: {
    label: "Partially refunded",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    icon: FiRotateCcw,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    icon: FiXCircle,
  },
};

const currency = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateBD = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
};

const invoiceNumber = (invoice) =>
  `Kroykori-${String(invoice?._id || "").slice(-8).toUpperCase()}`;

const StatusBadge = ({ status }) => {
  const normalized = String(status || "unpaid").toLowerCase();
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.unpaid;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon className="text-sm" />
      {config.label}
    </span>
  );
};

export default function MyInvoices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api("/api/my/invoices");
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    return items.reduce(
      (result, invoice) => {
        const currentStatus = String(invoice.status || "unpaid").toLowerCase();
        const amount = Number(invoice.totalAmount || 0);

        result.total += amount;
        result.count += 1;

        if (currentStatus === "paid") result.paid += amount;
        if (currentStatus === "unpaid") result.unpaid += amount;
        if (currentStatus.includes("refund")) result.refunded += amount;

        return result;
      },
      { count: 0, total: 0, paid: 0, unpaid: 0, refunded: 0 },
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((invoice) => {
      const invoiceStatus = String(invoice.status || "unpaid").toLowerCase();
      const matchesStatus = status === "all" || invoiceStatus === status;
      const searchableText = [
        invoice._id,
        invoiceNumber(invoice),
        invoice.orderId?._id,
        invoice.orderId,
        invoice.totalAmount,
        invoiceStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!keyword || searchableText.includes(keyword));
    });
  }, [items, search, status]);

  const downloadCSV = () => {
    const header = ["Invoice", "Order ID", "Total (BDT)", "Status", "Issued (BD)"];
    const rows = filteredItems.map((invoice) => [
      invoiceNumber(invoice),
      invoice.orderId?._id || invoice.orderId || "",
      Number(invoice.totalAmount || 0),
      invoice.status || "unpaid",
      dateBD(invoice.issuedAt || invoice.createdAt),
    ]);

    const csv =
      [header, ...rows]
        .map((row) =>
          row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n") + "\n";

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Kroykori_invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const printInvoice = (invoice) => {
    printBrandedInvoice(invoice, {
      brand: {
        name: "Kroykori",
        phone: "01714457750",
        email: "Kroykori.shopping@gmail.com",
        website: "www.Kroykori.com.bd",
        logo: "/logo.png",
        color: "#ff5a1f",
      },
    });
  };

  const summaryCards = [
    {
      title: "Total invoices",
      value: summary.count,
      note: currency(summary.total),
      icon: FiFileText,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Paid amount",
      value: currency(summary.paid),
      note: "Completed payments",
      icon: FiCheckCircle,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Due amount",
      value: currency(summary.unpaid),
      note: "Pending payments",
      icon: FiClock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Refunded",
      value: currency(summary.refunded),
      note: "Returned payments",
      icon: FiRotateCcw,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50/70 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-orange-600">
              <FiFileText />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">
                Billing history
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              My Invoices
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              আপনার সকল payment invoice দেখুন, print করুন অথবা PDF হিসেবে save করুন।
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={downloadCSV}
              disabled={!filteredItems.length}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiDownload />
              Export CSV
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ title, value, note, icon: Icon, color }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{title}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{note}</p>
                </div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
                  <Icon className="text-xl" />
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice or order ID..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50"
              />
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-400"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {error && (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : !filteredItems.length ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-2xl text-slate-400">
                <FiFileText />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-800">No invoices found</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                আপনার search বা filter পরিবর্তন করে আবার চেষ্টা করুন।
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Invoice</th>
                      <th className="px-5 py-4 text-left">Order</th>
                      <th className="px-5 py-4 text-left">Total</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Issued</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((invoice) => (
                      <tr key={invoice._id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">
                            #{invoiceNumber(invoice)}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            ID: {String(invoice._id || "").slice(-12)}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-600">
                          #{String(invoice.orderId?._id || invoice.orderId || "—").slice(-8).toUpperCase()}
                        </td>
                        <td className="px-5 py-4 text-base font-bold text-slate-900">
                          {currency(invoice.totalAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {dateBD(invoice.issuedAt || invoice.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => printInvoice(invoice)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <FiPrinter />
                            Print / PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {filteredItems.map((invoice) => (
                  <article key={invoice._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">#{invoiceNumber(invoice)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateBD(invoice.issuedAt || invoice.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <div className="my-4 flex items-end justify-between rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-xs text-slate-400">Order ID</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          #{String(invoice.orderId?._id || invoice.orderId || "—").slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Total</p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {currency(invoice.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => printInvoice(invoice)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <FiPrinter />
                      Download / Print invoice
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && filteredItems.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-sm text-slate-500">
              Showing {filteredItems.length} of {items.length} invoices
            </div>
          )}
        </section>
      </div>
    </div>
  );
}