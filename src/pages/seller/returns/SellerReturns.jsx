import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiImage,
  FiLoader,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiTruck,
  FiX,
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

const reasonLabels = {
  damaged: "Damaged Product",
  wrong_product: "Wrong Product",
  defective: "Defective Product",
  size_issue: "Size Issue",
  not_as_described: "Not as Described",
  changed_mind: "Changed Mind",
  other: "Other",
};

const statusStyles = {
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  returning: "bg-violet-100 text-violet-700",
  received: "bg-cyan-100 text-cyan-700",
  refunded:
    "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const SellerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [status, setStatus] = useState("");

  const [selectedReturn, setSelectedReturn] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const loadReturns = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "Seller authentication token পাওয়া যায়নি।",
      );
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();

    if (status) {
      params.set("status", status);
    }

    const query = params.toString();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/returns/seller${
          query ? `?${query}` : ""
        }`,
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
            "Returns load করা যায়নি।",
        );
      }

      setReturns(
        Array.isArray(data) ? data : [],
      );
    } catch (err) {
      setReturns([]);
      setError(
        err.message ||
          "Returns load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  const markAsReturning = async (
    returnRequest,
  ) => {
    const confirmed = window.confirm(
      "Customer product ফেরত পাঠানো শুরু করেছে—return status কি Returning করবেন?",
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    try {
      setUpdatingId(returnRequest._id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/returns/seller/${returnRequest._id}/returning`,
        {
          method: "PATCH",
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
            "Return status update করা যায়নি।",
        );
      }

      setSuccess(
        data?.message ||
          "Return marked as returning",
      );

      setSelectedReturn(null);
      await loadReturns();
    } catch (err) {
      setError(
        err.message ||
          "Return status update করতে সমস্যা হয়েছে।",
      );
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Product Returns
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Customer return requests এবং
            refund progress দেখুন।
          </p>
        </div>

        <button
          type="button"
          onClick={loadReturns}
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
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="mt-0.5 shrink-0 text-lg" />
            <span>{success}</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Filter */}

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-slate-900">
            Return Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {returns.length} requests found
          </p>
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="min-w-52 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
        >
          <option value="">
            All statuses
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
      </section>

      {/* Return list */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

              <p className="mt-3 text-sm text-slate-500">
                Returns loading...
              </p>
            </div>
          </div>
        ) : returns.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
            <FiRotateCcw className="text-5xl text-slate-300" />

            <h3 className="mt-4 font-bold text-slate-800">
              No return requests
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              এই status-এর কোনো return request
              পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Return
                    </th>
                    <th className="px-5 py-4">
                      Customer
                    </th>
                    <th className="px-5 py-4">
                      Reason
                    </th>
                    <th className="px-5 py-4">
                      Items
                    </th>
                    <th className="px-5 py-4">
                      Refund
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Date
                    </th>
                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {returns.map(
                    (returnRequest) => (
                      <tr
                        key={returnRequest._id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            #
                            {String(
                              returnRequest._id,
                            ).slice(-8)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Order #
                            {String(
                              returnRequest
                                .order?._id ||
                                returnRequest.order,
                            ).slice(-8)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {returnRequest.order
                              ?.customer?.name ||
                              (returnRequest.requestedBy ===
                              "guest"
                                ? "Guest Customer"
                                : "Customer")}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {returnRequest.order
                              ?.customer?.mobile ||
                              returnRequest.order
                                ?.customer
                                ?.email ||
                              "N/A"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">
                            {reasonLabels[
                              returnRequest
                                .reason
                            ] ||
                              returnRequest.reason}
                          </p>

                          <p className="mt-1 max-w-52 truncate text-xs text-slate-500">
                            {
                              returnRequest.details
                            }
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FiPackage />

                            {returnRequest.items?.reduce(
                              (total, item) =>
                                total +
                                Number(
                                  item.quantity ||
                                    0,
                                ),
                              0,
                            ) || 0}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-800">
                          {money(
                            returnRequest.totalRefundAmount,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                              statusStyles[
                                returnRequest
                                  .status
                              ] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {
                              returnRequest.status
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            returnRequest.createdAt,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReturn(
                                  returnRequest,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <FiEye />
                              Details
                            </button>

                            {returnRequest.status ===
                              "approved" && (
                              <button
                                type="button"
                                onClick={() =>
                                  markAsReturning(
                                    returnRequest,
                                  )
                                }
                                disabled={
                                  updatingId ===
                                  returnRequest._id
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                              >
                                {updatingId ===
                                returnRequest._id ? (
                                  <FiLoader className="animate-spin" />
                                ) : (
                                  <FiTruck />
                                )}
                                Returning
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

            {/* Mobile */}

            <div className="space-y-4 p-4 lg:hidden">
              {returns.map(
                (returnRequest) => (
                  <article
                    key={returnRequest._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">
                          Return #
                          {String(
                            returnRequest._id,
                          ).slice(-8)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(
                            returnRequest.createdAt,
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          statusStyles[
                            returnRequest.status
                          ] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {returnRequest.status}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="font-semibold text-slate-800">
                        {reasonLabels[
                          returnRequest.reason
                        ] ||
                          returnRequest.reason}
                      </p>

                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {returnRequest.details}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Refund amount
                      </span>

                      <span className="font-bold text-slate-900">
                        {money(
                          returnRequest.totalRefundAmount,
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReturn(
                            returnRequest,
                          )
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600"
                      >
                        <FiEye />
                        Details
                      </button>

                      {returnRequest.status ===
                      "approved" ? (
                        <button
                          type="button"
                          onClick={() =>
                            markAsReturning(
                              returnRequest,
                            )
                          }
                          disabled={
                            updatingId ===
                            returnRequest._id
                          }
                          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          <FiTruck />
                          Returning
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </>
        )}
      </section>

      {/* Details modal */}

      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Return Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  #
                  {selectedReturn._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReturn(null)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 font-bold capitalize text-slate-800">
                    {selectedReturn.status}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Requested by
                  </p>

                  <p className="mt-1 font-bold capitalize text-slate-800">
                    {
                      selectedReturn.requestedBy
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">
                    Total refund
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {money(
                      selectedReturn.totalRefundAmount,
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  Return Reason
                </h3>

                <p className="mt-2 font-semibold text-orange-600">
                  {reasonLabels[
                    selectedReturn.reason
                  ] || selectedReturn.reason}
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedReturn.details}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800">
                  Returned Items
                </h3>

                <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {selectedReturn.items?.map(
                    (item, index) => (
                      <div
                        key={`${item.product}-${index}`}
                        className="flex justify-between gap-4 p-4"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.productName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {money(
                              item.unitPrice,
                            )}{" "}
                            × {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold text-slate-800">
                          {money(
                            item.lineRefundAmount,
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Product refund</span>
                  <span>
                    {money(
                      selectedReturn.productRefundAmount,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm text-slate-600">
                  <span>Shipping refund</span>
                  <span>
                    {money(
                      selectedReturn.shippingRefundAmount,
                    )}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
                  <span>Total refund</span>
                  <span>
                    {money(
                      selectedReturn.totalRefundAmount,
                    )}
                  </span>
                </div>
              </div>

              {!!selectedReturn.evidence
                ?.length && (
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-800">
                    <FiImage />
                    Evidence
                  </h3>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedReturn.evidence.map(
                      (image, index) => (
                        <a
                          key={`${image}-${index}`}
                          href={image}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={image}
                            alt={`Return evidence ${
                              index + 1
                            }`}
                            className="h-32 w-full rounded-xl border border-slate-200 object-cover"
                          />
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}

              {selectedReturn.adminNote && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h3 className="font-bold text-blue-800">
                    Admin Note
                  </h3>

                  <p className="mt-2 text-sm text-blue-700">
                    {
                      selectedReturn.adminNote
                    }
                  </p>
                </div>
              )}

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">
                    Requested
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatDate(
                      selectedReturn.createdAt,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Received
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatDate(
                      selectedReturn.receivedAt,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">
                    Refunded
                  </p>
                  <p className="mt-1 font-semibold">
                    {formatDate(
                      selectedReturn.refundedAt,
                    )}
                  </p>
                </div>
              </div>

              {selectedReturn.status ===
                "approved" && (
                <button
                  type="button"
                  onClick={() =>
                    markAsReturning(
                      selectedReturn,
                    )
                  }
                  disabled={
                    updatingId ===
                    selectedReturn._id
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {updatingId ===
                  selectedReturn._id ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiTruck />
                  )}
                  Mark as Returning
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReturns;