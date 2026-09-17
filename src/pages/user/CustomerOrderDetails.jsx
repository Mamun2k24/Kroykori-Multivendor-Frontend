import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Store,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const API_BASE = (import.meta.env.VITE_APP_SERVER_URL || "").replace(
  /\/+$/,
  "",
);

const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const resolveImage = (image) => {
  if (!image) return "";
  if (/^(https?:|data:)/i.test(image)) return image;
  return apiUrl(image);
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Dhaka",
    }).format(new Date(value));
  } catch {
    return "—";
  }
};

const statusClasses = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  unpaid: "border-orange-200 bg-orange-50 text-orange-700",
  paid: "border-green-200 bg-green-50 text-green-700",
  requested: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-cyan-200 bg-cyan-50 text-cyan-700",
  returning: "border-blue-200 bg-blue-50 text-blue-700",
  received: "border-indigo-200 bg-indigo-50 text-indigo-700",
  refunded: "border-purple-200 bg-purple-50 text-purple-700",
  partially_refunded: "border-violet-200 bg-violet-50 text-violet-700",
};

const StatusBadge = ({ status }) => {
  const value = String(status || "unknown").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        statusClasses[value] ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
};

const ProductRow = ({ item }) => {
  const product = typeof item?.product === "object" ? item.product : null;
  const productId = product?._id || item?.product;
  const productName = item?.productName || product?.productName || "Product";
  const productImage =
    item?.image || product?.productImage?.[0] || product?.productImage || "";
  const unitPrice = Number(item?.finalPrice ?? item?.price ?? 0);
  const quantity = Number(item?.quantity || 1);
  const lineTotal = Number(item?.lineTotal ?? unitPrice * quantity);

  return (
    <div className="flex gap-3 border-b border-slate-100 py-4 last:border-0">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {productImage ? (
          <img
            src={resolveImage(productImage)}
            alt={productName}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Package size={26} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {productId ? (
          <Link
            to={`/product-details/${productId}`}
            className="line-clamp-2 font-semibold text-slate-900 hover:text-orange-600"
          >
            {productName}
          </Link>
        ) : (
          <p className="font-semibold text-slate-900">{productName}</p>
        )}

        {item?.sku && (
          <p className="mt-1 text-xs text-slate-400">SKU: {item.sku}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
            Qty: {quantity}
          </span>
          {item?.selectedSize && (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
              Size: {item.selectedSize}
            </span>
          )}
          {item?.selectedWeight && (
            <span className="rounded-full bg-cyan-50 px-2 py-1 text-cyan-700">
              Weight: {item.selectedWeight}
            </span>
          )}
          {item?.selectedColor && (
            <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-700">
              Color: {item.selectedColor}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-bold text-slate-900">{formatMoney(lineTotal)}</p>
        <p className="mt-1 text-xs text-slate-400">
          {formatMoney(unitPrice)} each
        </p>
      </div>
    </div>
  );
};

const SellerOrderSection = ({
  sellerOrder,
  onRequestReturn,
  returnSubmitting,
}) => {
  const shop = typeof sellerOrder?.shop === "object" ? sellerOrder.shop : null;
  const shopName = sellerOrder?.shopName || shop?.shopName || "Marketplace Shop";
  const items = Array.isArray(sellerOrder?.items) ? sellerOrder.items : [];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
            <Store size={19} />
          </span>
          <div className="min-w-0">
            {shop?.slug ? (
              <Link
                to={`/shop/${shop.slug}`}
                className="block truncate font-bold text-slate-900 hover:text-orange-600"
              >
                {shopName}
              </Link>
            ) : (
              <h3 className="truncate font-bold text-slate-900">{shopName}</h3>
            )}
            <p className="text-xs text-slate-500">
              Seller order #{String(sellerOrder?._id || "").slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={sellerOrder?.orderStatus} />
          <StatusBadge status={sellerOrder?.paymentStatus} />
          {sellerOrder?.returnStatus &&
            sellerOrder.returnStatus !== "none" && (
              <StatusBadge status={sellerOrder.returnStatus} />
            )}
        </div>
      </div>

      <div className="px-4 sm:px-5">
        {items.map((item, index) => (
          <ProductRow key={item?._id || `${sellerOrder?._id}-${index}`} item={item} />
        ))}
      </div>

      {(sellerOrder?.courierName || sellerOrder?.trackingCode) && (
        <div className="grid gap-3 border-t border-slate-100 bg-indigo-50/60 px-4 py-3 text-sm sm:grid-cols-2 sm:px-5">
          <div>
            <p className="text-xs text-slate-500">Courier</p>
            <p className="font-semibold text-slate-800">
              {sellerOrder?.courierName || "—"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-slate-500">Tracking code</p>
            <p className="font-semibold text-slate-800">
              {sellerOrder?.trackingCode || "—"}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm sm:grid-cols-3 sm:px-5">
        <div>
          <p className="text-slate-500">Product total</p>
          <p className="font-semibold text-slate-900">
            {formatMoney(
              sellerOrder?.productTotalAfterDiscount ?? sellerOrder?.subtotal,
            )}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Shipping</p>
          <p className="font-semibold text-slate-900">
            {formatMoney(sellerOrder?.shippingCost)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-slate-500">Shop total</p>
          <p className="font-bold text-orange-600">
            {formatMoney(sellerOrder?.total)}
          </p>
        </div>
      </div>

      {sellerOrder?.orderStatus === "delivered" &&
        (!sellerOrder?.returnStatus ||
          sellerOrder.returnStatus === "none") && (
          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">
              Product-এ সমস্যা থাকলে return window-এর মধ্যে request করুন।
            </p>

            <button
              type="button"
              onClick={() => onRequestReturn(sellerOrder)}
              disabled={returnSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
            >
              {returnSubmitting ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <RotateCcw size={16} />
              )}
              Request return
            </button>
          </div>
        )}
    </section>
  );
};

const CustomerOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const {
    data: order,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-order", orderId],
    enabled: Boolean(token && orderId),
    queryFn: async ({ signal }) => {
      const response = await fetch(apiUrl(`/api/my/orders/${orderId}`), {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || `Failed to load order (${response.status})`);
      }

      return data?.order || data;
    },
    retry: 1,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason) => {
      const response = await fetch(apiUrl(`/api/my/orders/${orderId}/cancel`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to cancel order");
      }

      return data;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["my-order", orderId], data?.order || data);
      await queryClient.invalidateQueries({ queryKey: ["my-orders"] });

      Swal.fire({
        icon: "success",
        title: "Order cancelled",
        text: data?.message || "Your order has been cancelled successfully.",
      });
    },
    onError: (mutationError) => {
      Swal.fire({
        icon: "error",
        title: "Cancellation failed",
        text: mutationError.message,
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: async ({ sellerOrderId, reason, details, evidence }) => {
      const response = await fetch(
        apiUrl(`/api/returns/my/${orderId}/${sellerOrderId}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason,
            details,
            evidence,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to submit return request",
        );
      }

      return {
        ...data,
        sellerOrderId,
      };
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["my-order", orderId], (currentOrder) => {
        if (!currentOrder) return currentOrder;

        return {
          ...currentOrder,
          sellerOrders: (currentOrder.sellerOrders || []).map(
            (sellerOrder) =>
              String(sellerOrder?._id) === String(data.sellerOrderId)
                ? {
                    ...sellerOrder,
                    returnStatus: "requested",
                    returnRequest:
                      data?.returnRequest?._id || sellerOrder.returnRequest,
                  }
                : sellerOrder,
          ),
        };
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["my-returns"] }),
      ]);

      Swal.fire({
        icon: "success",
        title: "Return request submitted",
        text:
          data?.message ||
          "Your return request has been submitted for review.",
      });
    },
    onError: (mutationError) => {
      Swal.fire({
        icon: "error",
        title: "Return request failed",
        text: mutationError.message,
      });
    },
  });

  const handleCancel = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Cancel this order?",
      input: "textarea",
      inputLabel: "Cancellation reason",
      inputPlaceholder: "Why do you want to cancel this order?",
      inputValidator: (value) =>
        String(value || "").trim() ? undefined : "Cancellation reason is required",
      showCancelButton: true,
      confirmButtonText: "Cancel order",
      confirmButtonColor: "#dc2626",
      showLoaderOnConfirm: true,
      preConfirm: (value) => String(value || "").trim(),
    });

    if (result.isConfirmed && result.value) {
      cancelMutation.mutate(result.value);
    }
  };

  const handleRequestReturn = async (sellerOrder) => {
    const { value: formValues } = await Swal.fire({
      title: `Return from ${sellerOrder?.shopName || "this shop"}`,
      html: `
        <div style="text-align:left">
          <label for="return-reason" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:#334155">
            Return reason
          </label>
          <select id="return-reason" class="swal2-select" style="display:block;width:100%;margin:0 0 14px 0">
            <option value="">Select a reason</option>
            <option value="damaged">Damaged product</option>
            <option value="wrong_product">Wrong product</option>
            <option value="defective">Defective product</option>
            <option value="size_issue">Size issue</option>
            <option value="not_as_described">Not as described</option>
            <option value="changed_mind">Changed mind</option>
            <option value="other">Other</option>
          </select>

          <label for="return-details" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:#334155">
            Details
          </label>
          <textarea id="return-details" class="swal2-textarea" minlength="10" placeholder="Describe the problem (minimum 10 characters)" style="display:block;width:100%;margin:0 0 14px 0"></textarea>

          <label for="return-evidence" style="display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:#334155">
            Evidence image URLs (optional)
          </label>
          <textarea id="return-evidence" class="swal2-textarea" placeholder="One image URL per line" style="display:block;width:100%;margin:0"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Submit return request",
      confirmButtonColor: "#ea580c",
      focusConfirm: false,
      preConfirm: () => {
        const reason = document.getElementById("return-reason")?.value || "";
        const details = String(
          document.getElementById("return-details")?.value || "",
        ).trim();
        const evidence = String(
          document.getElementById("return-evidence")?.value || "",
        )
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean);

        if (!reason) {
          Swal.showValidationMessage("Please select a return reason");
          return false;
        }

        if (details.length < 10) {
          Swal.showValidationMessage(
            "Return details must contain at least 10 characters",
          );
          return false;
        }

        const hasInvalidEvidence = evidence.some((value) => {
          try {
            const url = new URL(value);
            return !["http:", "https:"].includes(url.protocol);
          } catch {
            return true;
          }
        });

        if (hasInvalidEvidence) {
          Swal.showValidationMessage(
            "Every evidence item must be a valid http/https URL",
          );
          return false;
        }

        return { reason, details, evidence };
      },
    });

    if (!formValues) return;

    returnMutation.mutate({
      sellerOrderId: sellerOrder._id,
      ...formValues,
    });
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-amber-800">Login required</h1>
        <p className="mt-2 text-sm text-amber-700">
          Order details দেখতে প্রথমে login করুন।
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" /> Loading order...
      </div>
    );
  }

  if (error || !order?._id) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-xl font-bold text-red-700">Couldn’t load order</h1>
        <p className="mt-2 text-sm text-red-600">
          {error?.message || "Order not found"}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const sellerOrders = Array.isArray(order?.sellerOrders)
    ? order.sellerOrders
    : [];
  const canCancel = ["pending", "confirmed"].includes(
    String(order?.orderStatus || "").toLowerCase(),
  );

  return (
    <main className="space-y-5 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600"
        >
          <ArrowLeft size={18} /> Back to orders
        </button>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <StatusBadge status={order?.orderStatus} />
              <StatusBadge status={order?.paymentStatus} />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} /> {formatDate(order?.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck size={16} />
                {order?.shippingOption === "inside"
                  ? "Inside Dhaka"
                  : order?.shippingOption === "outside"
                    ? "Outside Dhaka"
                    : order?.shippingOption || "Delivery"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleDollarSign size={16} />
                {order?.paymentMethod || "Payment"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {cancelMutation.isPending ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <XCircle size={17} />
                )}
                Cancel order
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {sellerOrders.length > 0 ? (
            sellerOrders.map((sellerOrder, index) => (
              <SellerOrderSection
                key={sellerOrder?._id || `${order._id}-${index}`}
                sellerOrder={sellerOrder}
                onRequestReturn={handleRequestReturn}
                returnSubmitting={
                  returnMutation.isPending &&
                  String(returnMutation.variables?.sellerOrderId) ===
                    String(sellerOrder?._id)
                }
              />
            ))
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white px-5">
              {(order?.products || []).map((item, index) => (
                <ProductRow key={item?._id || index} item={item} />
              ))}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <UserRound size={18} className="text-orange-600" /> Customer
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold text-slate-900">
                {order?.customer?.name || "—"}
              </p>
              <p className="text-slate-600">{order?.customer?.mobile || "—"}</p>
              <p className="break-all text-slate-600">
                {order?.customer?.email || "—"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <MapPin size={18} className="text-orange-600" /> Delivery address
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {order?.address || "—"}
              {order?.district ? `, ${order.district}` : ""}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Payment summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Subtotal</span>
                <strong>{formatMoney(order?.subtotal)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Shipping</span>
                <strong>{formatMoney(order?.shippingCost)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Discount</span>
                <strong className="text-emerald-600">
                  -{formatMoney(order?.discountAmount)}
                </strong>
              </div>
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-base">
                <span className="font-bold text-slate-900">Grand total</span>
                <strong className="text-orange-600">
                  {formatMoney(order?.totalPrice)}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
};

export default CustomerOrderDetails;