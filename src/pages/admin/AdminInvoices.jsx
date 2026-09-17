import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCcw,
  Search,
  WalletCards,
} from "lucide-react";

import { api } from "../../api/http";
import { printBrandedInvoice } from "../../utils/invoiceTemplate";
import KroykoriLogo from "../../assets/images/logo.png";

export default function AdminInvoices() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [payingId, setPayingId] = useState("");
  const [error, setError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [selected, setSelected] = useState({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const currency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const dateBD = (date, withTime = true) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",

      ...(withTime && {
        hour: "2-digit",
        minute: "2-digit",
      }),

      hour12: true,
      timeZone: "Asia/Dhaka",
    }).format(parsedDate);
  };

  const getInvoiceCode = (invoice) => {
    if (
      invoice.invoiceNumber ||
      invoice.invoiceCode ||
      invoice.code
    ) {
      return (
        invoice.invoiceNumber ||
        invoice.invoiceCode ||
        invoice.code
      );
    }

    const shortId = String(invoice._id || "").slice(-8);

    return shortId
      ? `Kroykori-${shortId.toUpperCase()}`
      : "Kroykori-INVOICE";
  };

  const getCustomerName = (invoice) =>
    invoice.customer?.name ||
    invoice.customerInfo?.name ||
    invoice.userId?.name ||
    invoice.user?.name ||
    "Guest Customer";

  const getCustomerMobile = (invoice) =>
    invoice.customer?.mobile ||
    invoice.customer?.phone ||
    invoice.customerInfo?.mobile ||
    invoice.userId?.mobile ||
    invoice.userId?.phone ||
    invoice.user?.mobile ||
    "—";

  const loadInvoices = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api("/api/invoices");

      const invoiceList = Array.isArray(response)
        ? response
        : response?.items ||
          response?.invoices ||
          response?.data ||
          [];

      setItems(invoiceList);
      setSelected({});
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Invoices could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const createFromOrder = async (event) => {
    event.preventDefault();

    const cleanOrderId = orderId.trim();

    if (!cleanOrderId) {
      alert("Enter an Order ID.");
      return;
    }

    if (cleanOrderId.length !== 24) {
      alert("Enter a valid 24-character Order ID.");
      return;
    }

    setCreating(true);

    try {
      await api("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          orderId: cleanOrderId,
        }),
      });

      setOrderId("");
      await loadInvoices();
    } catch (err) {
      console.error(err);

      alert(
        err?.message ||
          "Invoice could not be created."
      );
    } finally {
      setCreating(false);
    }
  };

  const markPaid = async (invoiceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this invoice as paid?"
    );

    if (!confirmed) return;

    setPayingId(invoiceId);

    try {
      await api(`/api/invoices/${invoiceId}/paid`, {
        method: "PATCH",
      });

      setItems((currentItems) =>
        currentItems.map((invoice) =>
          invoice._id === invoiceId
            ? {
                ...invoice,
                status: "paid",
                paidAmount:
                  invoice.totalAmount ||
                  invoice.grandTotal ||
                  invoice.totalPrice ||
                  0,
                dueAmount: 0,
              }
            : invoice
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err?.message ||
          "Invoice status could not be updated."
      );
    } finally {
      setPayingId("");
    }
  };

  const printInvoice = (invoice) => {
    printBrandedInvoice(invoice, {
      brand: {
        name: "Kroykori Mart",

        slogan:
          "Trusted products, great deals and easy shopping",

        address:
          "Bhola Sadar, Bhola, Bangladesh",

        phone: "+8801714457750",

        email:
          "Kroykori.shopping@gmail.com",

        // তোমার আসল domain এখানে বসাবে
        website: "https://Kroykori.com",

        openingHours:
          "Sat–Thu, 9:00 AM – 10:00 PM",

        // public/Kroykori-logo.png
        logo: KroykoriLogo,

        color: "#4f46e5",
        secondaryColor: "#0f172a",
      },
    });
  };

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((invoice) => {
      const invoiceCode = getInvoiceCode(invoice)
        .toLowerCase();

      const customerName = getCustomerName(invoice)
        .toLowerCase();

      const customerMobile = getCustomerMobile(invoice)
        .toLowerCase();

      const invoiceStatus = String(
        invoice.status || "unpaid"
      ).toLowerCase();

      const matchesSearch =
        !keyword ||
        invoiceCode.includes(keyword) ||
        customerName.includes(keyword) ||
        customerMobile.includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        invoiceStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => {
    return items.reduce(
      (result, invoice) => {
        const total = Number(
          invoice.totalAmount ??
            invoice.grandTotal ??
            invoice.totalPrice ??
            0
        );

        const status = String(
          invoice.status || "unpaid"
        ).toLowerCase();

        result.totalInvoices += 1;
        result.totalValue += total;

        if (status === "paid") {
          result.paidInvoices += 1;
          result.paidValue += total;
        } else {
          result.unpaidInvoices += 1;
          result.unpaidValue += total;
        }

        return result;
      },
      {
        totalInvoices: 0,
        totalValue: 0,
        paidInvoices: 0,
        paidValue: 0,
        unpaidInvoices: 0,
        unpaidValue: 0,
      }
    );
  }, [items]);

  const allChecked =
    filteredItems.length > 0 &&
    filteredItems.every(
      (invoice) => selected[invoice._id]
    );

  const selectedCount = Object.values(
    selected
  ).filter(Boolean).length;

  const toggleAll = (checked) => {
    if (!checked) {
      setSelected({});
      return;
    }

    const nextSelected = {};

    filteredItems.forEach((invoice) => {
      nextSelected[invoice._id] = true;
    });

    setSelected(nextSelected);
  };

  const downloadCSV = (
    onlySelected = false
  ) => {
    const invoiceList = onlySelected
      ? items.filter(
          (invoice) => selected[invoice._id]
        )
      : filteredItems;

    if (!invoiceList.length) {
      alert("No invoices are available to download.");
      return;
    }

    const header = [
      "Invoice Number",
      "Customer",
      "Mobile",
      "Total BDT",
      "Status",
      "Payment Method",
      "Issued Date",
    ];

    const rows = invoiceList.map((invoice) => [
      getInvoiceCode(invoice),
      getCustomerName(invoice),
      getCustomerMobile(invoice),

      String(
        invoice.totalAmount ??
          invoice.grandTotal ??
          invoice.totalPrice ??
          0
      ),

      invoice.status || "unpaid",

      invoice.paymentMethod ||
        invoice.payment?.method ||
        "Cash on Delivery",

      dateBD(
        invoice.issuedAt ||
          invoice.createdAt,
        true
      ),
    ]);

    const csvContent =
      [header, ...rows]
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(value).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob(
      ["\uFEFF", csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    link.download = `Kroykori_mart_invoices_${
      new Date().toISOString().slice(0, 10)
    }${onlySelected ? "_selected" : ""}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const getStatusStyle = (status) => {
    const currentStatus = String(
      status || "unpaid"
    ).toLowerCase();

    if (currentStatus === "paid") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    }

    if (
      currentStatus === "void" ||
      currentStatus === "cancelled" ||
      currentStatus === "refunded"
    ) {
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    }

    if (currentStatus === "partial") {
      return "bg-indigo-50 text-indigo-700 ring-indigo-600/20";
    }

    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-2 p-1.5">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Kroykori Mart Invoices
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, manage, print and export customer
              invoices.
            </p>
          </div>

          <button
            type="button"
            onClick={loadInvoices}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Invoices"
            value={stats.totalInvoices}
            description={currency(stats.totalValue)}
            icon={<FileText size={22} />}
          />

          <StatCard
            title="Paid Invoices"
            value={stats.paidInvoices}
            description={currency(stats.paidValue)}
            icon={<CheckCircle2 size={22} />}
          />

          <StatCard
            title="Unpaid Invoices"
            value={stats.unpaidInvoices}
            description={currency(stats.unpaidValue)}
            icon={<WalletCards size={22} />}
          />

          <StatCard
            title="Selected"
            value={selectedCount}
            description="Invoices selected"
            icon={<Download size={22} />}
          />
        </div>

        {/* Create invoice */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">
              Create invoice from order
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the MongoDB Order ID to generate a new
              invoice.
            </p>
          </div>

          <form
            onSubmit={createFromOrder}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              placeholder="Enter 24-character Order ID"
              value={orderId}
              onChange={(event) =>
                setOrderId(event.target.value)
              }
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <FileText size={17} />
                  Create Invoice
                </>
              )}
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search invoice, customer or mobile..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="all">
                All statuses
              </option>

              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">
                Partial
              </option>
              <option value="refunded">
                Refunded
              </option>
              <option value="void">Void</option>
            </select>

            <button
              type="button"
              onClick={() => downloadCSV(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={17} />
              Export filtered
            </button>

            <button
              type="button"
              onClick={() => downloadCSV(true)}
              disabled={!selectedCount}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={17} />
              Export selected
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2
                  size={32}
                  className="mx-auto animate-spin text-indigo-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading invoices...
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="w-12 px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(event) =>
                          toggleAll(
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>

                    <th className="px-4 py-4 text-left font-semibold text-slate-600">
                      Invoice
                    </th>

                    <th className="px-4 py-4 text-left font-semibold text-slate-600">
                      Customer
                    </th>

                    <th className="px-4 py-4 text-left font-semibold text-slate-600">
                      Total
                    </th>

                    <th className="px-4 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-4 py-4 text-left font-semibold text-slate-600">
                      Issued
                    </th>

                    <th className="px-4 py-4 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((invoice) => {
                    const invoiceStatus =
                      String(
                        invoice.status || "unpaid"
                      ).toLowerCase();

                    const totalAmount = Number(
                      invoice.totalAmount ??
                        invoice.grandTotal ??
                        invoice.totalPrice ??
                        0
                    );

                    return (
                      <tr
                        key={invoice._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={
                              !!selected[invoice._id]
                            }
                            onChange={(event) =>
                              setSelected(
                                (current) => ({
                                  ...current,

                                  [invoice._id]:
                                    event.target
                                      .checked,
                                })
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="font-bold text-slate-900">
                            #
                            {getInvoiceCode(
                              invoice
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {String(
                              invoice._id || ""
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800">
                            {getCustomerName(
                              invoice
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {getCustomerMobile(
                              invoice
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                          {currency(totalAmount)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${getStatusStyle(
                              invoiceStatus
                            )}`}
                          >
                            {invoiceStatus}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {dateBD(
                            invoice.issuedAt ||
                              invoice.createdAt,
                            true
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                printInvoice(
                                  invoice
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                              title="Print or save invoice as PDF"
                            >
                              <Printer size={15} />
                              Print
                            </button>

                            {invoiceStatus !==
                              "paid" && (
                              <button
                                type="button"
                                onClick={() =>
                                  markPaid(
                                    invoice._id
                                  )
                                }
                                disabled={
                                  payingId ===
                                  invoice._id
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {payingId ===
                                invoice._id ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2
                                    size={15}
                                  />
                                )}

                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!filteredItems.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center"
                      >
                        <FileText
                          size={40}
                          className="mx-auto text-slate-300"
                        />

                        <h3 className="mt-3 font-bold text-slate-700">
                          No invoices found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing the search or
                          status filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  );
}