import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiUnlock,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";

const SERVER_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${SERVER_URL}/api${path}`;

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString()}`;

const typeLabels = {
  earning: "Order Earning",
  earning_release: "Earning Release",
  withdrawal: "Withdrawal",
  refund: "Refund",
  adjustment: "Adjustment",
};

const typeStyles = {
  earning:
    "bg-blue-50 text-blue-700 border-blue-200",
  earning_release:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  withdrawal:
    "bg-violet-50 text-violet-700 border-violet-200",
  refund:
    "bg-red-50 text-red-700 border-red-200",
  adjustment:
    "bg-slate-100 text-slate-700 border-slate-200",
};

const statusStyles = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200",
  available:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  requested:
    "bg-blue-50 text-blue-700 border-blue-200",
  approved:
    "bg-cyan-50 text-cyan-700 border-cyan-200",
  paid:
    "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:
    "bg-red-50 text-red-700 border-red-200",
  cancelled:
    "bg-slate-100 text-slate-700 border-slate-200",
};

const AdminSellerTransactions = () => {
  const [transactions, setTransactions] =
    useState([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState({
      total: 0,
      totalPages: 1,
      limit: 20,
    });
  const [loading, setLoading] =
    useState(true);
  const [selected, setSelected] =
    useState(null);
  const [releasingId, setReleasingId] =
    useState("");

  const token = localStorage.getItem("token");

  const loadTransactions =
    useCallback(async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams({
          page: String(page),
          limit: "20",
        });

        if (type) {
          query.set("type", type);
        }

        if (status) {
          query.set("status", status);
        }

        const response = await fetch(
          apiUrl(
            `/admin/seller-transactions?${query.toString()}`,
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load transactions",
          );
        }

        setTransactions(data?.items || []);

        setPagination({
          total: data?.total || 0,
          totalPages:
            data?.totalPages || 1,
          limit: data?.limit || 20,
        });
      } catch (error) {
        toast.error(error.message);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }, [page, type, status, token]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setPage(1);
  }, [type, status]);

  const filteredTransactions =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      if (!keyword) return transactions;

      return transactions.filter(
        (item) => {
          const text = [
            item._id,
            item.seller?.name,
            item.seller?.email,
            item.seller?.mobile,
            item.shop?.shopName,
            item.order?._id,
            item.description,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(keyword);
        },
      );
    }, [transactions, search]);

  const amountClass = (item) => {
    if (
      ["withdrawal", "refund"].includes(
        item.type,
      )
    ) {
      return "text-red-600";
    }

    return "text-emerald-600";
  };

  const amountPrefix = (item) =>
    ["withdrawal", "refund"].includes(
      item.type,
    )
      ? "−"
      : "+";

  const canRelease = (item) =>
    item?.type === "earning" &&
    item?.status === "pending";

  const releaseEarning = async (item) => {
    if (!canRelease(item) || releasingId) return;

    const confirmed = window.confirm(
      `Release ${formatMoney(item.amount)} to ${item.shop?.shopName || "this seller"}?`,
    );

    if (!confirmed) return;

    try {
      setReleasingId(item._id);

      const response = await fetch(
        apiUrl(`/admin/seller-earnings/${item._id}/release`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to release earning");
      }

      toast.success(data?.message || "Earning released successfully");
      setSelected(null);
      await loadTransactions();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReleasingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Transactions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View seller earnings,
            withdrawals, refunds and
            adjustments.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTransactions}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium"
        >
          <FiRefreshCw
            className={
              loading ? "animate-spin" : ""
            }
          />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_200px_200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search seller, shop or order..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">
              All transaction types
            </option>
            <option value="earning">
              Order Earning
            </option>
            <option value="earning_release">
              Earning Release
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
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
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
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <FiRefreshCw className="animate-spin text-3xl text-orange-500" />
          </div>
        ) : filteredTransactions.length ===
          0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <FiCreditCard className="mb-3 text-5xl text-slate-300" />

            <p className="font-medium text-slate-700">
              No transactions found
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Seller
                    </th>
                    <th className="px-5 py-3">
                      Shop
                    </th>
                    <th className="px-5 py-3">
                      Type
                    </th>
                    <th className="px-5 py-3">
                      Amount
                    </th>
                    <th className="px-5 py-3">
                      Status
                    </th>
                    <th className="px-5 py-3">
                      Date
                    </th>
                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(
                    (item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {item.seller
                              ?.name || "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.seller
                              ?.email ||
                              item.seller
                                ?.mobile ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {item.shop
                            ?.shopName || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              typeStyles[
                                item.type
                              ] ||
                              typeStyles.adjustment
                            }`}
                          >
                            {typeLabels[
                              item.type
                            ] || item.type}
                          </span>
                        </td>

                        <td
                          className={`px-5 py-4 font-bold ${amountClass(
                            item,
                          )}`}
                        >
                          {amountPrefix(item)}
                          {formatMoney(
                            item.amount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusStyles[
                                item.status
                              ] ||
                              statusStyles.pending
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(
                            item.createdAt,
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canRelease(item) && (
                              <button
                                type="button"
                                onClick={() => releaseEarning(item)}
                                disabled={releasingId === item._id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                              >
                                <FiUnlock />
                                {releasingId === item._id ? "Releasing..." : "Release"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelected(item)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600"
                            >
                              <FiEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredTransactions.map(
                (item) => (
                  <button
                    type="button"
                    key={item._id}
                    onClick={() =>
                      setSelected(item)
                    }
                    className="rounded-xl border border-slate-200 p-4 text-left"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.shop
                            ?.shopName ||
                            item.seller
                              ?.name ||
                            "Seller"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {typeLabels[
                            item.type
                          ] || item.type}
                        </p>
                      </div>

                      <p
                        className={`font-bold ${amountClass(
                          item,
                        )}`}
                      >
                        {amountPrefix(item)}
                        {formatMoney(
                          item.amount,
                        )}
                      </p>
                    </div>
                  </button>
                ),
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Total {pagination.total}{" "}
            transactions
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((value) =>
                  Math.max(1, value - 1),
                )
              }
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <FiChevronLeft />
            </button>

            <span className="px-3 text-sm">
              Page {page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >=
                pagination.totalPages
              }
              onClick={() =>
                setPage((value) =>
                  value + 1,
                )
              }
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Transaction details
                </h2>
                <p className="text-sm text-slate-500">
                  #{selected._id}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">
                  Seller
                </p>
                <p className="font-medium">
                  {selected.seller?.name ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Shop
                </p>
                <p className="font-medium">
                  {selected.shop?.shopName ||
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Gross amount
                </p>
                <p className="font-medium">
                  {formatMoney(
                    selected.grossAmount,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Commission
                </p>
                <p className="font-medium">
                  {formatMoney(
                    selected.commissionAmount,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Transaction amount
                </p>
                <p
                  className={`font-bold ${amountClass(
                    selected,
                  )}`}
                >
                  {amountPrefix(selected)}
                  {formatMoney(
                    selected.amount,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Status
                </p>
                <p className="font-medium capitalize">
                  {selected.status}
                </p>
              </div>

              {selected.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Description
                  </p>
                  <p className="font-medium">
                    {selected.description}
                  </p>
                </div>
              )}

              {selected.processedBy && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Processed by
                  </p>
                  <p className="font-medium">
                    {selected.processedBy
                      .name ||
                      selected.processedBy
                        .email}
                  </p>
                </div>
              )}
            </div>

            {canRelease(selected) && (
              <button
                type="button"
                onClick={() => releaseEarning(selected)}
                disabled={releasingId === selected._id}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <FiUnlock />
                {releasingId === selected._id
                  ? "Releasing earning..."
                  : `Release ${formatMoney(selected.amount)}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerTransactions;