import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiCheck,
  FiDollarSign,
  FiEye,
  FiPackage,
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

const getFileUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${SERVER_URL}${
    url.startsWith("/") ? "" : "/"
  }${url}`;
};

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString()}`;

const statusStyles = {
  requested:
    "border-amber-200 bg-amber-50 text-amber-700",
  approved:
    "border-blue-200 bg-blue-50 text-blue-700",
  rejected:
    "border-red-200 bg-red-50 text-red-700",
  returning:
    "border-violet-200 bg-violet-50 text-violet-700",
  received:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  refunded:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:
    "border-slate-300 bg-slate-100 text-slate-700",
};

const actionTitles = {
  approve: "Approve return request",
  reject: "Reject return request",
  received: "Confirm returned products received",
  refund: "Finalize customer refund",
};

const AdminReturnRequests = () => {
  const [returns, setReturns] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [selected, setSelected] =
    useState(null);
  const [actionData, setActionData] =
    useState(null);
  const [adminNote, setAdminNote] =
    useState("");
  const [processing, setProcessing] =
    useState(false);

  const token = localStorage.getItem("token");

  const loadReturns = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (status) {
        query.set("status", status);
      }

      const response = await fetch(
        apiUrl(
          `/returns/admin${
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
            "Failed to load return requests",
        );
      }

      setReturns(
        Array.isArray(data)
          ? data
          : data?.items || [],
      );
    } catch (error) {
      toast.error(error.message);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const filteredReturns = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) return returns;

    return returns.filter((item) => {
      const text = [
        item._id,
        item.order?._id,
        item.shop?.shopName,
        item.seller?.name,
        item.seller?.email,
        item.user?.name,
        item.user?.email,
        item.guestId,
        item.order?.customer?.name,
        item.order?.customer?.mobile,
        item.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [returns, search]);

  const openAction = (item, action) => {
    setActionData({ item, action });

    setAdminNote(
      action === "reject"
        ? ""
        : item.adminNote || "",
    );
  };

  const closeAction = () => {
    setActionData(null);
    setAdminNote("");
  };

  const submitAction = async () => {
    if (!actionData) return;

    const { item, action } = actionData;
    const note = adminNote.trim();

    if (action === "reject" && !note) {
      toast.error(
        "Rejection reason is required",
      );
      return;
    }

    if (
      action === "refund" &&
      !window.confirm(
        `Finalize refund of ${formatMoney(
          item.totalRefundAmount,
        )}? This will adjust the seller wallet.`,
      )
    ) {
      return;
    }

    const endpoints = {
      approve: {
        path: `/returns/admin/${item._id}/decision`,
        body: {
          action: "approve",
          adminNote: note,
        },
      },

      reject: {
        path: `/returns/admin/${item._id}/decision`,
        body: {
          action: "reject",
          adminNote: note,
        },
      },

      received: {
        path: `/returns/admin/${item._id}/received`,
        body: { adminNote: note },
      },

      refund: {
        path: `/returns/admin/${item._id}/refund`,
        body: { adminNote: note },
      },
    };

    const request = endpoints[action];

    try {
      setProcessing(true);

      const response = await fetch(
        apiUrl(request.path),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            request.body,
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to process return",
        );
      }

      toast.success(
        data?.message ||
          "Return updated successfully",
      );

      closeAction();
      setSelected(null);

      await loadReturns();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const customerName = (item) =>
    item.user?.name ||
    item.order?.customer?.name ||
    "Guest customer";

  const customerContact = (item) =>
    item.user?.email ||
    item.user?.mobile ||
    item.order?.customer?.mobile ||
    item.order?.customer?.email ||
    item.guestId ||
    "—";

  const actionButtons = (item) => (
    <div className="flex flex-wrap gap-2">
      {item.status === "requested" && (
        <>
          <button
            type="button"
            onClick={() =>
              openAction(item, "approve")
            }
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
          >
            Approve
          </button>

          <button
            type="button"
            onClick={() =>
              openAction(item, "reject")
            }
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white"
          >
            Reject
          </button>
        </>
      )}

      {["approved", "returning"].includes(
        item.status,
      ) && (
        <button
          type="button"
          onClick={() =>
            openAction(item, "received")
          }
          className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
        >
          Mark received
        </button>
      )}

      {item.status === "received" && (
        <button
          type="button"
          onClick={() =>
            openAction(item, "refund")
          }
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
        >
          Finalize refund
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Return Requests
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review returned products,
            restore stock and process refunds.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReturns}
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
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_200px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customer, shop or order..."
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
              All return statuses
            </option>
            <option value="requested">
              Requested
            </option>
            <option value="approved">
              Approved
            </option>
            <option value="rejected">
              Rejected
            </option>
            <option value="returning">
              Returning
            </option>
            <option value="received">
              Received
            </option>
            <option value="refunded">
              Refunded
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
        ) : filteredReturns.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center">
            <FiPackage className="mb-3 text-5xl text-slate-300" />

            <p className="font-medium text-slate-700">
              No return requests found
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Return
                    </th>
                    <th className="px-5 py-3">
                      Customer
                    </th>
                    <th className="px-5 py-3">
                      Shop
                    </th>
                    <th className="px-5 py-3">
                      Reason
                    </th>
                    <th className="px-5 py-3">
                      Refund
                    </th>
                    <th className="px-5 py-3">
                      Status
                    </th>
                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.map(
                    (item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            #
                            {String(
                              item._id,
                            ).slice(-8)}
                          </p>

                          <p className="text-xs text-slate-500">
                            Order #
                            {String(
                              item.order
                                ?._id ||
                                item.order,
                            ).slice(-8)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {customerName(
                              item,
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            {customerContact(
                              item,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {item.shop
                              ?.shopName || "—"}
                          </p>

                          <p className="text-xs text-slate-500">
                            {item.seller
                              ?.name || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm capitalize text-slate-600">
                          {item.reason?.replaceAll(
                            "_",
                            " ",
                          )}
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-800">
                          {formatMoney(
                            item.totalRefundAmount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusStyles[
                                item.status
                              ] ||
                              statusStyles.requested
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelected(item)
                              }
                              className="rounded-lg border border-slate-200 p-2 text-slate-600"
                            >
                              <FiEye />
                            </button>

                            {item.status ===
                              "requested" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(
                                    item,
                                    "approve",
                                  )
                                }
                                className="rounded-lg bg-blue-600 p-2 text-white"
                              >
                                <FiCheck />
                              </button>
                            )}

                            {item.status ===
                              "received" && (
                              <button
                                type="button"
                                onClick={() =>
                                  openAction(
                                    item,
                                    "refund",
                                  )
                                }
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
              {filteredReturns.map(
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
                            ?.shopName || "Shop"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {customerName(item)}
                        </p>
                      </div>

                      <p className="font-bold text-orange-600">
                        {formatMoney(
                          item.totalRefundAmount,
                        )}
                      </p>
                    </div>

                    <span
                      className={`mt-3 inline-block rounded-full border px-2 py-1 text-xs ${
                        statusStyles[
                          item.status
                        ] ||
                        statusStyles.requested
                      }`}
                    >
                      {item.status}
                    </span>
                  </button>
                ),
              )}
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-bold">
                  Return details
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

            <div className="space-y-6 p-5">
              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Customer
                  </p>
                  <p className="font-medium">
                    {customerName(selected)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Shop
                  </p>
                  <p className="font-medium">
                    {selected.shop
                      ?.shopName || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Requested by
                  </p>
                  <p className="font-medium capitalize">
                    {selected.requestedBy}
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
              </div>

              <div>
                <h3 className="font-semibold">
                  Return reason
                </h3>

                <p className="mt-2 capitalize text-slate-700">
                  {selected.reason?.replaceAll(
                    "_",
                    " ",
                  )}
                </p>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {selected.details}
                </p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold">
                  Returned products
                </h3>

                <div className="space-y-3">
                  {selected.items?.map(
                    (item, index) => (
                      <div
                        key={`${item.product}-${index}`}
                        className="flex items-center justify-between rounded-xl border p-4"
                      >
                        <div>
                          <p className="font-medium">
                            {
                              item.productName
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            Quantity:{" "}
                            {item.quantity} ×{" "}
                            {formatMoney(
                              item.unitPrice,
                            )}
                          </p>
                        </div>

                        <p className="font-bold">
                          {formatMoney(
                            item.lineRefundAmount,
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {selected.evidence?.length >
                0 && (
                <div>
                  <h3 className="mb-3 font-semibold">
                    Evidence
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {selected.evidence.map(
                      (file, index) => (
                        <a
                          key={`${file}-${index}`}
                          href={getFileUrl(file)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={getFileUrl(file)}
                            alt="Return evidence"
                            className="h-40 w-full rounded-xl border bg-slate-100 object-contain"
                          />
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Product refund
                  </p>
                  <p className="font-bold">
                    {formatMoney(
                      selected.productRefundAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Shipping refund
                  </p>
                  <p className="font-bold">
                    {formatMoney(
                      selected.shippingRefundAmount,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Seller deduction
                  </p>
                  <p className="font-bold text-red-600">
                    {formatMoney(
                      selected.sellerDeduction,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Customer refund
                  </p>
                  <p className="font-bold text-emerald-600">
                    {formatMoney(
                      selected.totalRefundAmount,
                    )}
                  </p>
                </div>
              </div>

              {selected.adminNote && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    Admin note
                  </p>
                  <p className="mt-1">
                    {selected.adminNote}
                  </p>
                </div>
              )}

              <div className="flex justify-end border-t pt-5">
                {actionButtons(selected)}
              </div>
            </div>
          </div>
        </div>
      )}

      {actionData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">
              {actionTitles[actionData.action]}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Refund amount:{" "}
              {formatMoney(
                actionData.item
                  .totalRefundAmount,
              )}
            </p>

            <textarea
              rows={4}
              value={adminNote}
              onChange={(event) =>
                setAdminNote(
                  event.target.value,
                )
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
                        "refund"
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

export default AdminReturnRequests;