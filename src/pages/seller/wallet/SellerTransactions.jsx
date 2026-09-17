import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiDollarSign,
  FiLoader,
  FiRefreshCw,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString(
    "en-BD",
  )}`;

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
};

const typeLabels = {
  earning: "Order Earning",
  earning_release: "Earning Released",
  withdrawal: "Withdrawal",
  refund: "Refund",
  adjustment: "Adjustment",
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  available:
    "bg-emerald-100 text-emerald-700",
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const isDebitTransaction = (type) =>
  type === "withdrawal" ||
  type === "refund";

const SellerTransactions = () => {
  const [items, setItems] = useState([]);

  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  const loadTransactions =
    useCallback(async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Seller authentication token পাওয়া যায়নি।",
        );
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (type) {
        params.set("type", type);
      }

      if (status) {
        params.set("status", status);
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/seller/wallet/transactions?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          },
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Transactions load করা যায়নি।",
          );
        }

        setItems(
          Array.isArray(data?.items)
            ? data.items
            : [],
        );

        setTotal(Number(data?.total || 0));

        setTotalPages(
          Math.max(
            Number(data?.totalPages || 1),
            1,
          ),
        );
      } catch (err) {
        setItems([]);

        setError(
          err.message ||
            "Transactions load করতে সমস্যা হয়েছে।",
        );
      } finally {
        setLoading(false);
      }
    }, [page, limit, type, status]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const clearFilters = () => {
    setType("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transaction History
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Earnings, withdrawals, refunds
            এবং adjustments দেখুন।
          </p>
        </div>

        <button
          type="button"
          onClick={loadTransactions}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">
              All transaction types
            </option>
            <option value="earning">
              Order Earning
            </option>
            <option value="earning_release">
              Earning Released
            </option>
            <option value="withdrawal">
              Withdrawal
            </option>
            <option value="refund">
              Refund
            </option>
            <option value="adjustment">
              Adjustment
            </option>
          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
          >
            <option value="">
              All statuses
            </option>
            <option value="pending">
              Pending
            </option>
            <option value="available">
              Available
            </option>
            <option value="requested">
              Requested
            </option>
            <option value="approved">
              Approved
            </option>
            <option value="paid">
              Paid
            </option>
            <option value="rejected">
              Rejected
            </option>
            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Transactions */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Total {total} transactions
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

              <p className="mt-3 text-sm text-slate-500">
                Transactions loading...
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
            <FiCreditCard className="text-5xl text-slate-300" />

            <h3 className="mt-4 font-bold text-slate-800">
              No transactions found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              এই filter-এর কোনো transaction
              পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px]">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Transaction
                    </th>
                    <th className="px-5 py-4">
                      Order
                    </th>
                    <th className="px-5 py-4">
                      Gross
                    </th>
                    <th className="px-5 py-4">
                      Commission
                    </th>
                    <th className="px-5 py-4">
                      Amount
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((transaction) => {
                    const isDebit =
                      isDebitTransaction(
                        transaction.type,
                      );

                    return (
                      <tr
                        key={transaction._id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                isDebit
                                  ? "bg-red-100 text-red-600"
                                  : "bg-emerald-100 text-emerald-600"
                              }`}
                            >
                              {isDebit ? (
                                <FiTrendingDown />
                              ) : (
                                <FiTrendingUp />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {typeLabels[
                                  transaction
                                    .type
                                ] ||
                                  transaction.type}
                              </p>

                              <p className="mt-1 max-w-64 truncate text-xs text-slate-500">
                                {transaction.description ||
                                  "Seller transaction"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {transaction.order ? (
                            <>
                              <p className="font-semibold text-slate-700">
                                #
                                {String(
                                  transaction
                                    .order._id ||
                                    transaction.order,
                                ).slice(-8)}
                              </p>

                              {transaction.order
                                .orderStatus && (
                                <p className="mt-1 text-xs capitalize text-slate-500">
                                  {
                                    transaction
                                      .order
                                      .orderStatus
                                  }
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {transaction.grossAmount
                            ? money(
                                transaction.grossAmount,
                              )
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {transaction.commissionAmount
                            ? money(
                                transaction.commissionAmount,
                              )
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <p
                            className={`font-bold ${
                              isDebit
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {isDebit ? "-" : "+"}
                            {money(
                              transaction.amount,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                              statusStyles[
                                transaction
                                  .status
                              ] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            transaction.createdAt,
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="space-y-4 p-4 md:hidden">
              {items.map((transaction) => {
                const isDebit =
                  isDebitTransaction(
                    transaction.type,
                  );

                return (
                  <article
                    key={transaction._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          isDebit
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {isDebit ? (
                          <FiTrendingDown />
                        ) : (
                          <FiTrendingUp />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800">
                          {typeLabels[
                            transaction.type
                          ] || transaction.type}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            transaction.createdAt,
                          )}
                        </p>
                      </div>

                      <p
                        className={`font-bold ${
                          isDebit
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {isDebit ? "-" : "+"}
                        {money(transaction.amount)}
                      </p>
                    </div>

                    {transaction.description && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        {transaction.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Status
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusStyles[
                            transaction.status
                          ] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}

            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous - 1,
                    )
                  }
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft />
                </button>

                <span className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous + 1,
                    )
                  }
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default SellerTransactions;