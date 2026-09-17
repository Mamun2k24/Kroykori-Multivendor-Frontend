import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { FiX, FiUpload, FiTrash, FiCheckCircle } from "react-icons/fi";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));
const MAX_IMAGES = 4;
const USE_FREE_DELIVERY_ZONES = true;

const withBase = (p) => {
  const base = import.meta.env.VITE_APP_SERVER_URL || "";
  const needsSlash = base.endsWith("/") ? "" : "/";
  return `${base}${needsSlash}${String(p).replace(/^\/+/, "")}`;
};

const cleanMultiline = (v) =>
  String(v || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

const toNumOrUndef = (v) => {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function ProductEdit({
  isOpen = true,
  isClose = () => {},
  product: productToEdit,
  refetch,
  onSuccess,
  title = "Edit Product",
}) {
  const id = productToEdit?._id;

  const [isColorOpen, setIsColorOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sku, setSku] = useState("");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");

  const [buyPrice, setBuyPrice] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [price, setPrice] = useState("");

  const [status, setStatus] = useState("available");
  const [stock, setStock] = useState("");
  const [details, setDetails] = useState("");
  const [longDetailsHtml, setLongDetailsHtml] = useState("");
  const [imageUrl, setImageUrl] = useState([]);

  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const [deliveryType, setDeliveryType] = useState("cash_on_delivery");
  const [deliveryZone, setDeliveryZone] = useState("inside_dhaka");

  // ============================
  // PRE BOOK STATE
  // ============================
  const [preBookEnabled, setPreBookEnabled] = useState(false);
  const [preBookDate, setPreBookDate] = useState("");
  const [preBookLimit, setPreBookLimit] = useState(0);

  const [sizeWeights, setSizeWeights] = useState([{ size: "" }]);
  const [chestSizes, setChestSizes] = useState([{ size: "" }]);
  const [waistSizes, setWaistSizes] = useState([{ size: "" }]);
  const [selectedColors, setSelectedColors] = useState([]);

  const originalRef = useRef(null);
  const colorRef = useRef(null);

  const {
    data: fullProduct,
    isLoading: fullLoading,
    error: fullError,
  } = useQuery({
    queryKey: ["product-full", id],
    enabled: isOpen && !!id,
    queryFn: async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const r = await fetch(withBase(`api/products/manage/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(data?.message || "Failed to fetch product");
      }

      return data;
    },
    staleTime: 0,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    enabled: isOpen,
    queryFn: async () => {
      const r = await fetch(withBase("api/categories"), {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch categories");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: colorOptions = [] } = useQuery({
    queryKey: ["colors"],
    enabled: isOpen,
    queryFn: async () => {
      const r = await fetch(withBase("api/colors"), {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch colors");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const safeCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter((cat) => !cat.parent);
  }, [categories]);

  const safeColors = useMemo(() => colorOptions ?? [], [colorOptions]);

  const subcategoryOptions = selectedParentCategory?.subcategories || [];

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["clean"],
      ],
    }),
    []
  );

  useEffect(() => {
    if (!fullProduct || !Array.isArray(categories)) return;

    originalRef.current = fullProduct;

    setSku(fullProduct.sku ?? "");
    setProductName(fullProduct.productName ?? "");
    setBrand(fullProduct.brand ?? "");

    setBuyPrice(fullProduct.buyPrice ?? "");
    setRegularPrice(fullProduct.regularPrice ?? "");
    setPrice(fullProduct.price ?? "");

    setStatus(fullProduct.status ?? "available");
    setStock(fullProduct.stock ?? "");
    setDetails(fullProduct.details ?? "");
    setLongDetailsHtml(fullProduct.longDetails ?? "");

    setImageUrl(
      Array.isArray(fullProduct.productImage)
        ? fullProduct.productImage
        : fullProduct.productImage
        ? [fullProduct.productImage]
        : []
    );

    const delivery = fullProduct.delivery || {};
    setDeliveryType(delivery.type || "cash_on_delivery");
    setDeliveryZone(delivery.area || "inside_dhaka");

    const preBook = fullProduct.preBook || {};
    setPreBookEnabled(Boolean(preBook.enabled));
    setPreBookDate(
      preBook.expectedDeliveryDate
        ? preBook.expectedDeliveryDate.substring(0, 10)
        : ""
    );
    setPreBookLimit(preBook.limit || 0);

    const productCategoryIds =
      fullProduct.categoryIds ||
      fullProduct.categories ||
      fullProduct.category ||
      [];

    const ids = Array.isArray(productCategoryIds)
      ? productCategoryIds.map((x) => (typeof x === "string" ? x : x?._id)).filter(Boolean)
      : [];

    const parent =
      categories.find((cat) => ids.includes(cat._id)) ||
      categories.find((cat) => cat.name === fullProduct.categoryName) ||
      null;

    const sub =
      parent?.subcategories?.find((sub) => ids.includes(sub._id)) || null;

    setSelectedParentCategory(parent);
    setSelectedSubCategory(sub);

    const sw = Array.isArray(fullProduct.sizeWeight) ? fullProduct.sizeWeight : [];
    setSizeWeights(sw.length ? sw.map((x) => ({ size: x?.size ?? "" })) : [{ size: "" }]);

    const chest = Array.isArray(fullProduct.chest) ? fullProduct.chest : [];
    setChestSizes(chest.length ? chest.map((x) => ({ size: x?.size ?? "" })) : [{ size: "" }]);

    const waist = Array.isArray(fullProduct.waist) ? fullProduct.waist : [];
    setWaistSizes(waist.length ? waist.map((x) => ({ size: x?.size ?? "" })) : [{ size: "" }]);

    setSelectedColors(Array.isArray(fullProduct.color) ? fullProduct.color : []);
  }, [fullProduct, categories]);

  useEffect(() => {
    if (deliveryType !== "free_delivery") {
      setDeliveryZone("inside_dhaka");
    }
  }, [deliveryType]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (isColorOpen && colorRef.current && !colorRef.current.contains(e.target)) {
        setIsColorOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isColorOpen]);

  const toggleColor = (value) => {
    setSelectedColors((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (imageUrl.length + files.length > MAX_IMAGES) {
      toast.warn(`Max ${MAX_IMAGES} images allowed.`);
      return;
    }

    setIsUploading(true);

    try {
      const uploads = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append("image", file);

        const imageApiKey = import.meta.env.VITE_IMGBB_API_KEY;

        if (!imageApiKey) {
          throw new Error("Image upload API key is missing");
        }

        const r = await fetch(
          `https://api.imgbb.com/1/upload?key=${imageApiKey}`,
          {
            method: "POST",
            body: fd,
          },
        );

        const data = await r.json();
        if (data?.success) return data.data.url;
        throw new Error("Upload failed");
      });

      const results = await Promise.allSettled(uploads);
      const ok = results
        .filter((x) => x.status === "fulfilled")
        .map((x) => x.value);

      if (ok.length) {
        setImageUrl((prev) => [...prev, ...ok].slice(0, MAX_IMAGES));
        toast.success(`${ok.length} image(s) uploaded`);
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx) => {
    setImageUrl((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildPayload = () => {
    const orig = originalRef.current || {};
    const payload = {};

    const push = (key, val, compare = orig[key]) => {
      const changed = Array.isArray(val)
        ? JSON.stringify(val) !== JSON.stringify(compare ?? [])
        : val !== compare;

      if (changed) payload[key] = val;
    };

    const categoryIds = selectedParentCategory
      ? selectedSubCategory
        ? [selectedParentCategory._id, selectedSubCategory._id]
        : [selectedParentCategory._id]
      : [];

    push("productName", productName.trim(), (orig.productName ?? "").trim());
    push("sku", sku.trim(), (orig.sku ?? "").trim());
    push("brand", brand.trim(), (orig.brand ?? "").trim());

    push(
      "categoryIds",
      categoryIds,
      (orig.categories || [])
        .map((item) => (typeof item === "string" ? item : item?._id))
        .filter(Boolean),
    );

    push(
      "categoryName",
      selectedParentCategory?.name || "",
      orig.categoryName || "",
    );

    const bp = toNumOrUndef(buyPrice);
    const rp = toNumOrUndef(regularPrice);
    const sp = toNumOrUndef(price);

    if (bp !== undefined) push("buyPrice", bp, orig.buyPrice);
    if (rp !== undefined) push("regularPrice", rp, orig.regularPrice);
    if (sp !== undefined) push("price", sp, orig.price);

    push("status", status, orig.status ?? "available");

    const delivery = {
      type: deliveryType,
      area:
        deliveryType === "free_delivery"
          ? USE_FREE_DELIVERY_ZONES
            ? deliveryZone
            : "all_bangladesh"
          : null,
    };

    push("delivery", delivery, orig.delivery || {});

    const preBook = {
      enabled: preBookEnabled,
      expectedDeliveryDate: preBookDate || null,
      limit: Number(preBookLimit || 0),
      bookedCount: orig.preBook?.bookedCount || 0,
      requireAdvancePayment: orig.preBook?.requireAdvancePayment || false,
      advancePercentage: orig.preBook?.advancePercentage || 0,
      closed: orig.preBook?.closed || false,
    };

    push("preBook", preBook, orig.preBook || {});

    push("details", cleanMultiline(details), cleanMultiline(orig.details));
    push("longDetails", String(longDetailsHtml || "").trim(), String(orig.longDetails || "").trim());

    push("productImage", imageUrl, orig.productImage ?? []);

    const filteredSW = sizeWeights
      .map((row) => ({ size: String(row.size || "").trim() }))
      .filter((row) => row.size);

    const filteredChest = chestSizes
      .map((row) => ({ size: String(row.size || "").trim() }))
      .filter((row) => row.size);

    const filteredWaist = waistSizes
      .map((row) => ({ size: String(row.size || "").trim() }))
      .filter((row) => row.size);

    push("sizeWeight", filteredSW, orig.sizeWeight ?? []);
    push("chest", filteredChest, orig.chest ?? []);
    push("waist", filteredWaist, orig.waist ?? []);
    push("color", selectedColors, orig.color ?? []);

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;

    if (!productName.trim()) return toast.warn("Product name is required");
    if (!selectedParentCategory) return toast.warn("Please select a category");
    if (!imageUrl.length) return toast.warn("Please upload at least 1 image");
    if (!sku.trim()) return toast.warn("SKU is required");
    if (!cleanMultiline(details)) return toast.warn("Product info is required");
    if (!String(longDetailsHtml || "").trim()) return toast.warn("Full description is required");

    if (Number(buyPrice) < 0) return toast.warn("Buying price cannot be negative");
    if (Number(regularPrice) <= 0) return toast.warn("Regular price must be greater than 0");
    if (Number(price) <= 0) return toast.warn("Sell price must be greater than 0");
    if (Number(stock) < 0) return toast.warn("Stock cannot be negative");

    const payload = buildPayload();

    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update");
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const r = await fetch(withBase(`api/products/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw new Error(data?.message || "Failed to update product");
      }

      toast.success(data?.message || "Product updated successfully!");

      if (typeof refetch === "function") {
        await refetch();
      }

      if (typeof onSuccess === "function") {
        onSuccess(data);
      } else {
        isClose?.();
      }
    } catch (err) {
      toast.error(err?.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  if (fullLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow p-6 text-sm">Loading…</div>
      </div>
    );
  }

  if (fullError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow p-6 text-sm">
          Failed to load product.
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-4xl p-0 overflow-hidden max-h-[95vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
              <FiCheckCircle className="text-blue-600" />
            </span>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>

          <button
            type="button"
            onClick={isClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={selectedParentCategory?._id || ""}
                  onChange={(e) => {
                    const selected =
                      safeCategories.find((cat) => cat._id === e.target.value) || null;
                    setSelectedParentCategory(selected);
                    setSelectedSubCategory(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {safeCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subcategory</label>
                <select
                  value={selectedSubCategory?._id || ""}
                  onChange={(e) => {
                    const selected =
                      subcategoryOptions.find((sub) => sub._id === e.target.value) || null;
                    setSelectedSubCategory(selected);
                  }}
                  disabled={!selectedParentCategory}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:bg-gray-100"
                >
                  <option value="">Select subcategory</option>
                  {subcategoryOptions.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Buying Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Regular Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={regularPrice}
                  onChange={(e) => setRegularPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sell Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Delivery</label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={deliveryType === "cash_on_delivery"}
                    onChange={() => setDeliveryType("cash_on_delivery")}
                  />
                  Cash On Delivery
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    checked={deliveryType === "free_delivery"}
                    onChange={() => setDeliveryType("free_delivery")}
                  />
                  Free Delivery
                </label>
              </div>

              {deliveryType === "free_delivery" && USE_FREE_DELIVERY_ZONES && (
                <select
                  value={deliveryZone}
                  onChange={(e) => setDeliveryZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                >
                  <option value="inside_dhaka">Inside Dhaka</option>
                  <option value="outside_dhaka">Outside Dhaka</option>
                  <option value="all_bangladesh">All Bangladesh</option>
                </select>
              )}
            </div>

            {/* Pre-book section */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={preBookEnabled}
                  onChange={(e) => setPreBookEnabled(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Enable Pre-book
              </label>

              {preBookEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={preBookDate}
                      onChange={(e) => setPreBookDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pre-book Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={preBookLimit}
                      onChange={(e) => setPreBookLimit(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                >
                  <option value="available">Available</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  readOnly
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Product Images <span className="text-gray-500">(max {MAX_IMAGES})</span>
              </label>

              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiUpload />
                  <span>Click to upload</span>
                </div>

                <input
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={imageUrl.length >= MAX_IMAGES}
                />
              </label>

              {isUploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}

              {!!imageUrl.length && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {imageUrl.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-28 object-cover rounded-lg"
                        loading="lazy"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-full shadow"
                      >
                        <FiTrash className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SizeBlock
              title="Select Size"
              items={sizeWeights}
              setItems={setSizeWeights}
              placeholder="Size (e.g. S, M, L, XL)"
            />

            <SizeBlock
              title="Chest"
              items={chestSizes}
              setItems={setChestSizes}
              placeholder="Chest (e.g. 36, 38, 40)"
            />

            <SizeBlock
              title="Waist"
              items={waistSizes}
              setItems={setWaistSizes}
              placeholder="Waist (e.g. 28, 30, 32)"
            />

            <div className="relative" ref={colorRef}>
              <label className="block text-sm font-medium mb-1">Colors</label>

              <div
                className="w-full px-3 py-2 border rounded-lg cursor-pointer bg-white"
                onClick={() => setIsColorOpen((v) => !v)}
              >
                {selectedColors.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedColors.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-gray-100"
                      >
                        {c}
                        <span
                          className="w-3 h-3 rounded-full border"
                          style={{
                            background:
                              safeColors.find((x) => x.name === c)?.code || "#999",
                          }}
                        />
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Select colors</span>
                )}
              </div>

              {isColorOpen && (
                <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-56 overflow-y-auto shadow">
                  {safeColors.map((clr) => {
                    const value = clr.name;
                    const active = selectedColors.includes(value);

                    return (
                      <div
                        key={clr._id || value}
                        onClick={() => toggleColor(value)}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                          active ? "bg-blue-50" : ""
                        }`}
                      >
                        <span className="text-sm">{clr.name}</span>
                        <span
                          className={`w-5 h-5 rounded-full border ${
                            active ? "ring ring-blue-400" : ""
                          }`}
                          style={{ background: clr.code }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Short Product Info
              </label>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Full Description
              </label>

              <div className="rounded-lg overflow-hidden border border-gray-300 quillWrap">
                <Suspense fallback={<div className="p-4">Loading Editor...</div>}>
                  <ReactQuill
                    theme="snow"
                    value={longDetailsHtml}
                    onChange={setLongDetailsHtml}
                    modules={quillModules}
                    placeholder="Write full description..."
                  />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={isClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Close
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? "Updating…" : "Update Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SizeBlock({ title, items, setItems, placeholder }) {
  const addRow = () => setItems((prev) => [...prev, { size: "" }]);

  const changeRow = (index, value) => {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, size: value } : row))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium">{title}</label>

        <button
          type="button"
          onClick={addRow}
          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          + Add Row
        </button>
      </div>

      <div className="space-y-2">
        {items.map((row, i) => (
          <input
            key={i}
            value={row.size}
            onChange={(e) => changeRow(i, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}
      </div>
    </div>
  );
}