import React, { useEffect, useState } from "react";
import settingsApi from "../../hooks/settingsApi.jsx";

const AdminShippingSettings = () => {
  const [form, setForm] = useState({
    insideDhakaRate: 60,
    outsideDhakaRate: 120,
    freeThreshold: 0,
    freeForDistricts: [],
    campaign: { active: false, startAt: "", endAt: "", freeThreshold: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await settingsApi.fetchAdminShippingSettings(); // {success,data}
        const data = res?.data || {};
        setForm((prev) => ({
          ...prev,
          ...data,
          freeForDistricts: Array.isArray(data.freeForDistricts) ? data.freeForDistricts : [],
          campaign: { ...prev.campaign, ...(data.campaign || {}) },
        }));
      } catch (e) {
        setMsg(e?.message || "Failed to load shipping settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setMsg("");
      await settingsApi.updateShippingSettings(form);
      setMsg("Saved ✅");
    } catch (e) {
      setMsg(e?.message || "Save failed ❌");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="px-1 py-3 md:p-2 font-poppins max-w-full ">

  {/* Header */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
    <div>
      <h2 className="text-3xl font-bold text-gray-800">
        🚚 Shipping Settings
      </h2>
      <p className="text-gray-500 mt-1">
        Configure delivery charges and free shipping rules
      </p>
    </div>

    <button
      onClick={save}
      className="
      bg-gradient-to-r
      from-violet-600
      to-purple-600
      hover:from-violet-700
      hover:to-purple-700
      text-white
      px-6
      py-3
      rounded-xl
      font-medium
      shadow-lg
      hover:shadow-xl
      transition-all
      duration-300
      "
    >
      Save Changes
    </button>
  </div>

  {/* Message */}
  {msg && (
    <div
      className="
      mb-6
      p-4
      rounded-xl
      bg-green-50
      border
      border-green-200
      text-green-700
      "
    >
      {msg}
    </div>
  )}

  {/* Charges */}
  <div className="grid lg:grid-cols-2 gap-6">

    {/* Inside Dhaka */}
    <div
      className="
      bg-white
      border
      border-gray-200
      rounded-2xl
      p-6
      shadow-sm
      hover:shadow-md
      transition-all
      "
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
          🏙️
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            Inside Dhaka
          </h3>
          <p className="text-sm text-gray-500">
            Delivery charge within Dhaka city
          </p>
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          ৳
        </span>

        <input
          type="number"
          value={form.insideDhakaRate}
          onChange={(e) =>
            setForm({
              ...form,
              insideDhakaRate: Number(e.target.value),
            })
          }
          className="
          w-full
          pl-10
          pr-4
          py-3
          rounded-xl
          border
          border-gray-300
          focus:ring-2
          focus:ring-violet-500
          focus:border-violet-500
          outline-none
          "
        />
      </div>
    </div>

    {/* Outside Dhaka */}
    <div
      className="
      bg-white
      border
      border-gray-200
      rounded-2xl
      p-6
      shadow-sm
      hover:shadow-md
      transition-all
      "
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-xl">
          🌍
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            Outside Dhaka
          </h3>
          <p className="text-sm text-gray-500">
            Delivery charge outside Dhaka
          </p>
        </div>
      </div>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          ৳
        </span>

        <input
          type="number"
          value={form.outsideDhakaRate}
          onChange={(e) =>
            setForm({
              ...form,
              outsideDhakaRate: Number(e.target.value),
            })
          }
          className="
          w-full
          pl-10
          pr-4
          py-3
          rounded-xl
          border
          border-gray-300
          focus:ring-2
          focus:ring-violet-500
          focus:border-violet-500
          outline-none
          "
        />
      </div>
    </div>
  </div>

  {/* Free Shipping */}
  <div
    className="
    mt-6
    bg-white
    border
    border-gray-200
    rounded-2xl
    p-6
    shadow-sm
    "
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl">
        🎁
      </div>

      <div>
        <h3 className="font-semibold text-lg text-gray-800">
          Free Shipping Threshold
        </h3>

        <p className="text-sm text-gray-500">
          Orders above this amount receive free shipping
        </p>
      </div>
    </div>

    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
        ৳
      </span>

      <input
        type="number"
        value={form.freeThreshold}
        onChange={(e) =>
          setForm({
            ...form,
            freeThreshold: Number(e.target.value),
          })
        }
        className="
        w-full
        pl-10
        pr-4
        py-3
        rounded-xl
        border
        border-gray-300
        focus:ring-2
        focus:ring-green-500
        focus:border-green-500
        outline-none
        "
      />
    </div>

    <div className="mt-3 text-sm text-gray-500">
      Set to <span className="font-semibold">0</span> to disable free shipping.
    </div>
  </div>

</div>
  );
};

export default AdminShippingSettings;
