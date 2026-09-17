import { useCallback, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiCreditCard,
  FiImage,
  FiLoader,
  FiMapPin,
  FiRefreshCw,
  FiSave,
  FiTruck,
} from "react-icons/fi";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const initialForm = {
  shopName: "",
  logo: "",
  banner: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
  businessAddress: "",

  shippingSettings: {
    insideDhaka: 60,
    outsideDhaka: 120,
    freeDeliveryEnabled: false,
    freeDeliveryMinimum: 0,
  },

  paymentMethod: {
    method: "bkash",
    accountName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    routingNumber: "",
  },
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

const SellerShopProfile = () => {
  const [form, setForm] = useState(initialForm);
  const [shopMeta, setShopMeta] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadShop = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Seller authentication token পাওয়া যায়নি।");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/shops/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Shop load করা যায়নি",
        );
      }

      setShopMeta(data);

      setForm({
        shopName: data?.shopName || "",
        logo: data?.logo || "",
        banner: data?.banner || "",
        description: data?.description || "",
        contactEmail: data?.contactEmail || "",
        contactPhone: data?.contactPhone || "",
        businessAddress:
          data?.businessAddress || "",

        shippingSettings: {
          insideDhaka: Number(
            data?.shippingSettings?.insideDhaka ?? 60,
          ),
          outsideDhaka: Number(
            data?.shippingSettings?.outsideDhaka ?? 120,
          ),
          freeDeliveryEnabled: Boolean(
            data?.shippingSettings
              ?.freeDeliveryEnabled,
          ),
          freeDeliveryMinimum: Number(
            data?.shippingSettings
              ?.freeDeliveryMinimum ?? 0,
          ),
        },

        paymentMethod: {
          method:
            data?.paymentMethod?.method || "bkash",
          accountName:
            data?.paymentMethod?.accountName || "",
          accountNumber:
            data?.paymentMethod?.accountNumber || "",
          bankName:
            data?.paymentMethod?.bankName || "",
          branchName:
            data?.paymentMethod?.branchName || "",
          routingNumber:
            data?.paymentMethod?.routingNumber || "",
        },
      });
    } catch (err) {
      setError(
        err.message || "Shop load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleShippingChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      shippingSettings: {
        ...previous.shippingSettings,
        [name]:
          type === "checkbox" ? checked : value,
      },
    }));

    setSuccess("");
  };

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      paymentMethod: {
        ...previous.paymentMethod,
        [name]: value,
      },
    }));

    setSuccess("");
  };

  const validateForm = () => {
    if (!form.shopName.trim()) {
      return "Shop name দেওয়া প্রয়োজন।";
    }

    if (
      !form.contactEmail.trim() ||
      !/^\S+@\S+\.\S+$/.test(
        form.contactEmail.trim(),
      )
    ) {
      return "সঠিক contact email দিন।";
    }

    if (
      Number(form.shippingSettings.insideDhaka) <
        0 ||
      Number(form.shippingSettings.outsideDhaka) <
        0
    ) {
      return "Delivery charge শূন্যের কম হতে পারবে না।";
    }

    if (
      form.shippingSettings.freeDeliveryEnabled &&
      Number(
        form.shippingSettings.freeDeliveryMinimum,
      ) <= 0
    ) {
      return "Free delivery চালু করলে minimum order amount দিন।";
    }

    const payment = form.paymentMethod;

    if (!payment.method) {
      return "Payment method নির্বাচন করুন।";
    }

    if (!payment.accountName.trim()) {
      return "Payment account name দিন।";
    }

    if (!payment.accountNumber.trim()) {
      return "Payment account number দিন।";
    }

    if (
      payment.method === "bank" &&
      !payment.bankName.trim()
    ) {
      return "Bank name দেওয়া প্রয়োজন।";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication token পাওয়া যায়নি।");
      return;
    }

    const payload = {
      shopName: form.shopName.trim(),
      logo: form.logo.trim(),
      banner: form.banner.trim(),
      description: form.description.trim(),
      contactEmail:
        form.contactEmail.trim().toLowerCase(),
      contactPhone: form.contactPhone.trim(),
      businessAddress:
        form.businessAddress.trim(),

      shippingSettings: {
        insideDhaka: Number(
          form.shippingSettings.insideDhaka,
        ),
        outsideDhaka: Number(
          form.shippingSettings.outsideDhaka,
        ),
        freeDeliveryEnabled: Boolean(
          form.shippingSettings
            .freeDeliveryEnabled,
        ),
        freeDeliveryMinimum: Number(
          form.shippingSettings
            .freeDeliveryMinimum || 0,
        ),
      },

      paymentMethod: {
        method: form.paymentMethod.method,
        accountName:
          form.paymentMethod.accountName.trim(),
        accountNumber:
          form.paymentMethod.accountNumber.trim(),
        bankName:
          form.paymentMethod.method === "bank"
            ? form.paymentMethod.bankName.trim()
            : "",
        branchName:
          form.paymentMethod.method === "bank"
            ? form.paymentMethod.branchName.trim()
            : "",
        routingNumber:
          form.paymentMethod.method === "bank"
            ? form.paymentMethod.routingNumber.trim()
            : "",
      },
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/shops/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Shop update করা যায়নি।",
        );
      }

      setShopMeta((previous) => ({
        ...previous,
        ...data.shop,
      }));

      setSuccess(
        data?.message ||
          "Shop updated successfully",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.message ||
          "Shop update করতে সমস্যা হয়েছে।",
      );
    } finally {
      setSaving(false);
    }
  };

  const showBankFields =
    form.paymentMethod.method === "bank";

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />
          <p className="mt-3 text-sm text-slate-500">
            Shop information loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Shop Profile
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{shopMeta?.shopName}</span>

            {shopMeta?.slug && (
              <>
                <span>•</span>
                <span>/{shopMeta.slug}</span>
              </>
            )}

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                shopMeta?.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {shopMeta?.status || "Unknown"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={loadShop}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Shop images */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FiImage className="text-orange-500" />
              Shop Branding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Logo এবং banner-এর public image URL দিন।
            </p>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-2">
            <div>
              <label className={labelClass}>
                Shop logo URL
              </label>
              <input
                type="url"
                name="logo"
                value={form.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className={inputClass}
              />

              <div className="mt-4 flex h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                {form.logo ? (
                  <img
                    src={form.logo}
                    alt="Shop logo preview"
                    className="h-28 w-28 rounded-xl object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <FiImage className="mx-auto text-3xl" />
                    <p className="mt-2 text-sm">
                      Logo preview
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Shop banner URL
              </label>
              <input
                type="url"
                name="banner"
                value={form.banner}
                onChange={handleChange}
                placeholder="https://example.com/banner.jpg"
                className={inputClass}
              />

              <div className="mt-4 flex h-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                {form.banner ? (
                  <img
                    src={form.banner}
                    alt="Shop banner preview"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <FiImage className="mx-auto text-3xl" />
                    <p className="mt-2 text-sm">
                      Banner preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Basic information */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Basic Information
            </h2>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Shop name *
              </label>
              <input
                type="text"
                name="shopName"
                value={form.shopName}
                onChange={handleChange}
                placeholder="Enter shop name"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                Shop slug
              </label>
              <input
                type="text"
                value={shopMeta?.slug || ""}
                disabled
                className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
              />
            </div>

            <div>
              <label className={labelClass}>
                Contact email *
              </label>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail}
                onChange={handleChange}
                placeholder="seller@example.com"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                Contact phone
              </label>
              <input
                type="text"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                Business address
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-4 top-4 text-slate-400" />
                <textarea
                  name="businessAddress"
                  value={form.businessAddress}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter business address"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                Shop description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="আপনার shop সম্পর্কে লিখুন..."
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {form.description.length} characters
              </p>
            </div>
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FiTruck className="text-orange-500" />
              Shipping Settings
            </h2>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Inside Dhaka charge
              </label>
              <input
                type="number"
                min="0"
                name="insideDhaka"
                value={
                  form.shippingSettings.insideDhaka
                }
                onChange={handleShippingChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Outside Dhaka charge
              </label>
              <input
                type="number"
                min="0"
                name="outsideDhaka"
                value={
                  form.shippingSettings.outsideDhaka
                }
                onChange={handleShippingChange}
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  name="freeDeliveryEnabled"
                  checked={
                    form.shippingSettings
                      .freeDeliveryEnabled
                  }
                  onChange={handleShippingChange}
                  className="h-5 w-5 rounded border-slate-300 accent-orange-500"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    Enable free delivery
                  </p>
                  <p className="text-sm text-slate-500">
                    Minimum order amount পূরণ হলে
                    delivery charge থাকবে না।
                  </p>
                </div>
              </label>
            </div>

            {form.shippingSettings
              .freeDeliveryEnabled && (
              <div className="md:col-span-2">
                <label className={labelClass}>
                  Free delivery minimum amount
                </label>
                <input
                  type="number"
                  min="0"
                  name="freeDeliveryMinimum"
                  value={
                    form.shippingSettings
                      .freeDeliveryMinimum
                  }
                  onChange={handleShippingChange}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </section>

        {/* Payment method */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FiCreditCard className="text-orange-500" />
              Withdrawal Payment Method
            </h2>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Payment method *
              </label>
              <select
                name="method"
                value={form.paymentMethod.method}
                onChange={handlePaymentChange}
                className={inputClass}
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="bank">
                  Bank Account
                </option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Account name *
              </label>
              <input
                type="text"
                name="accountName"
                value={
                  form.paymentMethod.accountName
                }
                onChange={handlePaymentChange}
                className={inputClass}
                placeholder="Account holder name"
              />
            </div>

            <div>
              <label className={labelClass}>
                Account number *
              </label>
              <input
                type="text"
                name="accountNumber"
                value={
                  form.paymentMethod.accountNumber
                }
                onChange={handlePaymentChange}
                className={inputClass}
                placeholder={
                  showBankFields
                    ? "Bank account number"
                    : "01XXXXXXXXX"
                }
              />
            </div>

            {showBankFields && (
              <>
                <div>
                  <label className={labelClass}>
                    Bank name *
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={
                      form.paymentMethod.bankName
                    }
                    onChange={handlePaymentChange}
                    className={inputClass}
                    placeholder="Enter bank name"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Branch name
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={
                      form.paymentMethod.branchName
                    }
                    onChange={handlePaymentChange}
                    className={inputClass}
                    placeholder="Enter branch name"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Routing number
                  </label>
                  <input
                    type="text"
                    name="routingNumber"
                    value={
                      form.paymentMethod.routingNumber
                    }
                    onChange={handlePaymentChange}
                    className={inputClass}
                    placeholder="Enter routing number"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <div className="sticky bottom-4 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-44 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Shop Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerShopProfile;