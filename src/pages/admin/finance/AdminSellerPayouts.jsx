import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiEye,
  FiRefreshCw,
  FiSearch,
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

const statusStyles = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  approved:
    "border-blue-200 bg-blue-50 text-blue-700",
  paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
  cancelled:
    "border-slate-300 bg-slate-100 text-slate-700",
};

const AdminSellerPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [processing, setProcessing] =
    useState(false);
  const [selectedPayout, setSelectedPayout] =
    useState(null);
  const [actionData, setActionData] =
    useState(null);
  const [note, setNote] = useState("");

  const token = localStorage.getItem("token");

  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (status) {
        query.set("status", status);
      }

      const response = await fetch(
        apiUrl(
          `/admin/payouts${
            query.toString()
              ? `?${query.toString()}`
              : ""
          }`,
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
            "Failed to load payout requests",
        );
      }

      setPayouts(
        Array.isArray(data)
          ? data
          : data?.items ||
              data?.payouts ||
              [],
      );
    } catch (error) {
      toast.error(error.message);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const filteredPayouts = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    return payouts.filter((payout) => {
      if (
        status &&
        payout.status !== status
      ) {
        return false;
      }

      if (!keyword) return true;

      const searchableText = [
        payout._id,
        payout.seller?.name,
        payout.seller?.email,
        payout.seller?.mobile,
        payout.shop?.shopName,
        payout.paymentMethod?.method,
        payout.paymentMethod
          ?.accountName,
        payout.paymentMethod
          ?.accountNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [payouts, search, status]);

  const stats = useMemo(
    () => ({
      pending: payouts
        .filter(
          (item) =>
            item.status === "pending",
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0,
        ),

      approved: payouts
        .filter(
          (item) =>
            item.status === "approved",
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0,
        ),

      paid: payouts
        .filter(
          (item) => item.status === "paid",
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.amount || 0),
          0,
        ),
    }),
    [payouts],
  );

  const openAction = (payout, action) => {
    setActionData({
      payout,
      action,
    });

    setNote("");
  };

  const closeAction = () => {
    setActionData(null);
    setNote("");
  };

  const submitAction = async () => {
    if (!actionData) return;

    const { payout, action } = actionData;
    const cleanedNote = note.trim();

    if (
      action === "reject" &&
      !cleanedNote
    ) {
      toast.error(
        "Rejection reason is required",
      );
      return;
    }

    try {
      setProcessing(true);

      const body =
        action === "reject"
          ? { reason: cleanedNote }
          : { adminNote: cleanedNote };

      const response = await fetch(
        apiUrl(
          `/admin/payouts/${payout._id}/${action}`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to process payout",
        );
      }

      toast.success(
        data?.message ||
          "Payout updated successfully",
      );

      closeAction();
      setSelectedPayout(null);
      await loadPayouts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const paymentDetails = (method = {}) => {
    if (method.method === "bank") {
      return [
        method.accountName,
        method.accountNumber,
        method.bankName,
        method.branchName,
        method.routingNumber,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    return [
      method.method?.toUpperCase(),
      method.accountNumber,
      method.accountName,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Payouts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and process seller
            withdrawal requests.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayouts}
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">
            Pending payout
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {formatMoney(stats.pending)}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm text-blue-700">
            Approved payout
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-800">
            {formatMoney(stats.approved)}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">
            Paid amount
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {formatMoney(stats.paid)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_190px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search seller, shop or account..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500"
            />
          </div>

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
        ) : filteredPayouts.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <FiCreditCard className="mb-3 text-5xl text-slate-300" />
            <p className="font-medium text-slate-700">
              No payout requests found
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
                      Amount
                    </th>
                    <th className="px-5 py-3">
                      Payment account
                    </th>
                    <th className="px-5 py-3">
                      Status
                    </th>
                    <th className="px-5 py-3">
                      Requested
                    </th>
                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.map(
                    (payout) => (
                      <tr
                        key={payout._id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {payout.seller
                              ?.name || "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {payout.seller
                              ?.email ||
                              payout.seller
                                ?.mobile ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {payout.shop
                            ?.shopName || "—"}
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(
                            payout.amount,
                          )}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                          {paymentDetails(
                            payout.paymentMethod,
                          ) || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusStyles[
                                payout.status
                              ] ||
                              statusStyles.pending
                            }`}
                          >
                            {payout.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(
                            payout.createdAt,
                          ).toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPayout(
                                  payout,
                                )
                              }
                              title="View details"
                              className="rounded-lg border border-slate-200 p-2 text-slate-600"
                            >
                              <FiEye />
                            </button>

                            {payout.status ===
                              "pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(
                                    payout,
                                    "approve",
                                  )
                                }
                                title="Approve payout"
                                className="rounded-lg bg-blue-600 p-2 text-white"
                              >
                                <FiCheck />
                              </button>
                            )}

                            {[
                              "pending",
                              "approved",
                            ].includes(
                              payout.status,
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(
                                    payout,
                                    "reject",
                                  )
                                }
                                title="Reject payout"
                                className="rounded-lg bg-red-600 p-2 text-white"
                              >
                                <FiX />
                              </button>
                            )}

                            {payout.status ===
                              "approved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(
                                    payout,
                                    "paid",
                                  )
                                }
                                title="Mark as paid"
                                className="rounded-lg bg-emerald-600 p-2 text-white"
                              >
                                <FiDollarSign />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredPayouts.map(
                (payout) => (
                  <button
                    type="button"
                    key={payout._id}
                    onClick={() =>
                      setSelectedPayout(payout)
                    }
                    className="rounded-xl border border-slate-200 p-4 text-left"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {payout.shop
                            ?.shopName ||
                            payout.seller
                              ?.name ||
                            "Seller"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {paymentDetails(
                            payout.paymentMethod,
                          )}
                        </p>
                      </div>

                      <p className="font-bold text-orange-600">
                        {formatMoney(
                          payout.amount,
                        )}
                      </p>
                    </div>

                    <span
                      className={`mt-3 inline-block rounded-full border px-2 py-1 text-xs ${
                        statusStyles[
                          payout.status
                        ] ||
                        statusStyles.pending
                      }`}
                    >
                      {payout.status}
                    </span>
                  </button>
                ),
              )}
            </div>
          </>
        )}
      </div>

      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Payout details
                </h2>
                <p className="text-sm text-slate-500">
                  #{selectedPayout._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayout(null)
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
                  {selectedPayout.seller
                    ?.name || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Shop
                </p>
                <p className="font-medium">
                  {selectedPayout.shop
                    ?.shopName || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Amount
                </p>
                <p className="font-bold text-orange-600">
                  {formatMoney(
                    selectedPayout.amount,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Status
                </p>
                <p className="font-medium capitalize">
                  {selectedPayout.status}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">
                  Payment account
                </p>
                <p className="font-medium">
                  {paymentDetails(
                    selectedPayout.paymentMethod,
                  )}
                </p>
              </div>

              {selectedPayout.sellerNote && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Seller note
                  </p>
                  <p className="font-medium">
                    {
                      selectedPayout.sellerNote
                    }
                  </p>
                </div>
              )}

              {selectedPayout.adminNote && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Admin note
                  </p>
                  <p className="font-medium">
                    {
                      selectedPayout.adminNote
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {selectedPayout.status ===
                "pending" && (
                <button
                  onClick={() =>
                    openAction(
                      selectedPayout,
                      "approve",
                    )
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white"
                >
                  Approve
                </button>
              )}

              {[
                "pending",
                "approved",
              ].includes(
                selectedPayout.status,
              ) && (
                <button
                  onClick={() =>
                    openAction(
                      selectedPayout,
                      "reject",
                    )
                  }
                  className="rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white"
                >
                  Reject
                </button>
              )}

              {selectedPayout.status ===
                "approved" && (
                <button
                  onClick={() =>
                    openAction(
                      selectedPayout,
                      "paid",
                    )
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white"
                >
                  Mark as paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {actionData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold capitalize">
              {actionData.action} payout
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Amount:{" "}
              {formatMoney(
                actionData.payout.amount,
              )}
            </p>

            <textarea
              rows={4}
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              placeholder={
                actionData.action === "reject"
                  ? "Enter rejection reason..."
                  : "Enter admin note (optional)..."
              }
              className="mt-5 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-orange-500"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAction}
                className="rounded-lg border border-slate-200 px-4 py-2.5"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitAction}
                disabled={processing}
                className={`rounded-lg px-4 py-2.5 font-medium text-white disabled:opacity-50 ${
                  actionData.action ===
                  "reject"
                    ? "bg-red-600"
                    : actionData.action ===
                        "paid"
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                }`}
              >
                {processing
                  ? "Processing..."
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerPayouts;