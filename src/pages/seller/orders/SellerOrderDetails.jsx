import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiLoader,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import {
  Link,
  useParams,
} from "react-router-dom";

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

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-violet-100 text-violet-700",
  delivered:
    "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const SellerOrderDetails = () => {
  const { orderId, sellerOrderId } =
    useParams();

  const [orderData, setOrderData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const [form, setForm] = useState({
    orderStatus: "",
    courierName: "",
    trackingCode: "",
    sellerNote: "",
    cancellationReason: "",
  });

  const sellerOrder =
    orderData?.sellerOrder || null;

  const currentStatus =
    sellerOrder?.orderStatus || "";

  const allowedStatuses = useMemo(
    () =>
      STATUS_TRANSITIONS[currentStatus] ||
      [],
    [currentStatus],
  );

  const loadOrder = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "Seller authentication token পাওয়া যায়নি।",
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/seller/orders/${orderId}/${sellerOrderId}`,
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
            "Order load করা যায়নি।",
        );
      }

      setOrderData(data);

      setForm({
        orderStatus: "",
        courierName:
          data?.sellerOrder
            ?.courierName || "",
        trackingCode:
          data?.sellerOrder
            ?.trackingCode || "",
        sellerNote:
          data?.sellerOrder
            ?.sellerNote || "",
        cancellationReason: "",
      });
    } catch (err) {
      setOrderData(null);
      setError(
        err.message ||
          "Order load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, sellerOrderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!form.orderStatus) {
      setError(
        "পরবর্তী order status নির্বাচন করুন।",
      );
      return;
    }

    if (
      form.orderStatus === "shipped" &&
      (!form.courierName.trim() ||
        !form.trackingCode.trim())
    ) {
      setError(
        "Courier name এবং tracking code প্রয়োজন।",
      );
      return;
    }

    if (
      form.orderStatus === "cancelled" &&
      !form.cancellationReason.trim()
    ) {
      setError(
        "Cancellation reason প্রয়োজন।",
      );
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        orderStatus: form.orderStatus,
        sellerNote:
          form.sellerNote.trim(),
      };

      if (
        form.orderStatus === "shipped"
      ) {
        payload.courierName =
          form.courierName.trim();

        payload.trackingCode =
          form.trackingCode.trim();
      }

      if (
        form.orderStatus === "cancelled"
      ) {
        payload.cancellationReason =
          form.cancellationReason.trim();
      }

      const response = await fetch(
        `${API_URL}/api/seller/orders/${orderId}/${sellerOrderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Order status update করা যায়নি।",
        );
      }

      setSuccess(
        data?.message ||
          "Order status updated successfully",
      );

      await loadOrder();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.message ||
          "Order status update করতে সমস্যা হয়েছে।",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Order loading...
          </p>
        </div>
      </div>
    );
  }

  if (!orderData || !sellerOrder) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <FiAlertCircle className="mx-auto text-4xl text-red-500" />

        <h2 className="mt-3 font-bold text-red-700">
          Order পাওয়া যায়নি
        </h2>

        <Link
          to="/dashboard/seller/orders"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
        >
          <FiArrowLeft />
          Back to Orders
        </Link>
      </div>
    );
  }

  const totalQuantity = Array.isArray(
    sellerOrder.items,
  )
    ? sellerOrder.items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0,
      )
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <Link
            to="/dashboard/seller/orders"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-orange-600"
          >
            <FiArrowLeft />
            Back to Orders
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Order #
              {String(
                orderData.parentOrderId,
              ).slice(-8)}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                statusStyles[currentStatus] ||
                "bg-slate-100 text-slate-600"
              }`}
            >
              {currentStatus}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Placed on{" "}
            {formatDate(
              orderData.orderCreatedAt,
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrder}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <FiCheckCircle className="mt-0.5 shrink-0 text-lg" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Items */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <FiPackage className="text-orange-500" />
                Order Items
              </h2>

              <span className="text-sm text-slate-500">
                {totalQuantity} items
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {sellerOrder.items?.map(
                (item) => (
                  <div
                    key={item._id}
                    className="flex flex-col gap-4 p-5 sm:flex-row"
                  >
                    <img
                      src={
                        item.image ||
                        "/default-product.png"
                      }
                      alt={item.productName}
                      className="h-24 w-24 rounded-xl border border-slate-200 object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800">
                        {item.productName}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        SKU: {item.sku || "N/A"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        {item.selectedSize && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1">
                            Size:{" "}
                            {item.selectedSize}
                          </span>
                        )}

                        {item.selectedColor && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1">
                            Color:{" "}
                            {item.selectedColor}
                          </span>
                        )}

                        {item.selectedWeight && (
                          <span className="rounded-lg bg-slate-100 px-2 py-1">
                            Weight:{" "}
                            {item.selectedWeight}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-bold text-slate-800">
                        {money(
                          item.finalPrice ||
                            item.price,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Qty: {item.quantity}
                      </p>

                      <p className="mt-2 font-bold text-orange-600">
                        {money(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* Customer */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FiUser className="text-orange-500" />
              Customer Information
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Customer name
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {orderData.customer?.name ||
                    "Guest Customer"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Contact
                </p>

                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-800">
                  <FiPhone />
                  {orderData.customer?.mobile ||
                    "N/A"}
                </p>

                {orderData.customer?.email && (
                  <p className="mt-1 text-sm text-slate-500">
                    {orderData.customer.email}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Delivery address
                </p>

                <p className="mt-1 flex items-start gap-2 text-slate-700">
                  <FiMapPin className="mt-1 shrink-0" />

                  <span>
                    {orderData.address || "N/A"}
                    {orderData.district
                      ? `, ${orderData.district}`
                      : ""}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Tracking */}

          {(sellerOrder.courierName ||
            sellerOrder.trackingCode) && (
            <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
              <h2 className="flex items-center gap-2 font-bold text-violet-800">
                <FiTruck />
                Shipping Information
              </h2>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-violet-500">
                    Courier
                  </p>

                  <p className="mt-1 font-semibold text-violet-900">
                    {sellerOrder.courierName ||
                      "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-violet-500">
                    Tracking code
                  </p>

                  <p className="mt-1 font-semibold text-violet-900">
                    {sellerOrder.trackingCode ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {currentStatus === "cancelled" && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <h2 className="font-bold text-red-700">
                Cancellation Information
              </h2>

              <p className="mt-2 text-sm text-red-600">
                {sellerOrder.cancellationReason ||
                  "No cancellation reason provided"}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {/* Summary */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>
                  {money(
                    sellerOrder.subtotal,
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>
                  -{" "}
                  {money(
                    sellerOrder.couponDiscount,
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>
                  {money(
                    sellerOrder.shippingCost,
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>
                  {money(sellerOrder.total)}
                </span>
              </div>

              {Number(
                sellerOrder.commissionAmount,
              ) > 0 && (
                <>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-slate-600">
                    <span>
                      Platform commission
                    </span>
                    <span>
                      -
                      {money(
                        sellerOrder.commissionAmount,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Your earning</span>
                    <span>
                      {money(
                        sellerOrder.sellerEarning,
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Payment
                </p>

                <p
                  className={`mt-1 font-bold capitalize ${
                    sellerOrder.paymentStatus ===
                    "paid"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {sellerOrder.paymentStatus ||
                    "unpaid"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Method
                </p>

                <p className="mt-1 font-bold text-slate-700">
                  {orderData.paymentMethod ||
                    "N/A"}
                </p>
              </div>
            </div>
          </section>

          {/* Status update */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Update Status
            </h2>

            {allowedStatuses.length ===
            0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                এই order-এর আর কোনো status
                update available নেই।
              </div>
            ) : (
              <form
                onSubmit={handleUpdate}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Next status
                  </label>

                  <select
                    name="orderStatus"
                    value={form.orderStatus}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="">
                      Select status
                    </option>

                    {allowedStatuses.map(
                      (nextStatus) => (
                        <option
                          key={nextStatus}
                          value={nextStatus}
                        >
                          {nextStatus
                            .charAt(0)
                            .toUpperCase() +
                            nextStatus.slice(1)}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {form.orderStatus ===
                  "shipped" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Courier name *
                      </label>

                      <input
                        type="text"
                        name="courierName"
                        value={
                          form.courierName
                        }
                        onChange={handleChange}
                        placeholder="Pathao Courier"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Tracking code *
                      </label>

                      <input
                        type="text"
                        name="trackingCode"
                        value={
                          form.trackingCode
                        }
                        onChange={handleChange}
                        placeholder="TRACK-123456"
                        className={inputClass}
                        required
                      />
                    </div>
                  </>
                )}

                {form.orderStatus ===
                  "cancelled" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Cancellation reason *
                    </label>

                    <textarea
                      name="cancellationReason"
                      value={
                        form.cancellationReason
                      }
                      onChange={handleChange}
                      rows={3}
                      placeholder="Enter cancellation reason"
                      className={inputClass}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Seller note
                  </label>

                  <textarea
                    name="sellerNote"
                    value={form.sellerNote}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Optional order note"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle />
                      Update Order
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default SellerOrderDetails;