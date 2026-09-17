// src/utils/invoiceTemplate.js

export function printBrandedInvoice(invoice, options = {}) {
  if (!invoice) {
    alert("Invoice information was not found.");
    return;
  }

  const brand = {
    name: "Kroykori Mart",
    slogan: "Trusted products, great deals and easy shopping",
    address: "Bhola Sadar, Bhola, Bangladesh",
    phone: "+8801714457750",
    email: "Kroykori.shopping@gmail.com",

    // তোমার আসল domain হলে এখানে পরিবর্তন করবে
    website: "https://Kroykori.com",

    openingHours: "Sat–Thu, 9:00 AM – 10:00 PM",

    // public/Kroykori-logo.png
    logo: "/Kroykori-logo.png",

    color: "#4f46e5",
    secondaryColor: "#0f172a",

    ...options.brand,
  };

  const escapeHtml = (value = "") =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character]
    );

  const absoluteUrl = (url = "") => {
    try {
      return new URL(url, window.location.origin).href;
    } catch {
      return url;
    }
  };

  const currency = (amount) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dhaka",
    }).format(parsedDate);
  };

  const formatAddress = (address) => {
    if (!address) return "—";

    if (typeof address === "string") {
      return address;
    }

    if (typeof address === "object") {
      return [
        address.address,
        address.street,
        address.area,
        address.upazila,
        address.thana,
        address.district,
        address.division,
        address.postCode,
        address.postalCode,
        address.country,
      ]
        .filter(Boolean)
        .join(", ");
    }

    return "—";
  };

  const getInvoiceCode = () => {
    const customCode =
      invoice.invoiceNumber ||
      invoice.invoiceCode ||
      invoice.code ||
      invoice.orderNumber;

    if (customCode) {
      return String(customCode);
    }

    const shortId = String(invoice._id || invoice.id || "").slice(-8);

    return shortId ? `Kroykori-${shortId.toUpperCase()}` : "Kroykori-INVOICE";
  };

  const getCustomer = () => {
    const customer =
      invoice.customer ||
      invoice.customerInfo ||
      invoice.shippingAddress ||
      {};

    const user = invoice.userId || invoice.user || {};

    return {
      name:
        customer.name ||
        customer.fullName ||
        user.name ||
        user.fullName ||
        "Guest Customer",

      mobile:
        customer.mobile ||
        customer.phone ||
        customer.phoneNumber ||
        user.mobile ||
        user.phone ||
        "—",

      email: customer.email || user.email || "—",

      address: formatAddress(
        customer.address ||
          customer.fullAddress ||
          invoice.shippingAddress ||
          invoice.deliveryAddress ||
          invoice.address
      ),
    };
  };

  const rawItems =
    invoice.items ||
    invoice.products ||
    invoice.orderItems ||
    invoice.cartItems ||
    [];

  const items = rawItems.map((item) => {
    const product =
      item.product ||
      item.productId ||
      item.item ||
      {};

    const quantity = Number(
      item.qty ??
        item.quantity ??
        item.productQuantity ??
        1
    );

    const unitPrice = Number(
      item.price ??
        item.unitPrice ??
        item.salePrice ??
        item.finalPrice ??
        product.price ??
        product.salePrice ??
        0
    );

    const lineTotal = Number(
      item.subtotal ??
        item.subTotal ??
        item.total ??
        quantity * unitPrice
    );

    const variationParts = [
      item.selectedSize || item.size || item.selectedSizeWeight,
      item.selectedColor || item.color,
      item.selectedWeight || item.weight,
    ].filter(Boolean);

    return {
      name:
        item.name ||
        item.productName ||
        item.title ||
        product.productName ||
        product.name ||
        product.title ||
        "Product",

      sku:
        item.sku ||
        product.sku ||
        "",

      variation: variationParts.join(" • "),
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  const calculatedSubtotal = items.reduce(
    (total, item) => total + Number(item.lineTotal || 0),
    0
  );

  const subtotal = Number(
    invoice.subtotal ??
      invoice.subTotal ??
      invoice.itemsTotal ??
      calculatedSubtotal
  );

  const shipping = Number(
    invoice.shippingCost ??
      invoice.shippingCharge ??
      invoice.deliveryCharge ??
      invoice.shipping ??
      0
  );

  const discount = Number(
    invoice.discount ??
      invoice.discountAmount ??
      invoice.couponDiscount ??
      invoice.totalDiscount ??
      0
  );

  const vat = Number(
    invoice.vat ??
      invoice.vatAmount ??
      invoice.tax ??
      invoice.taxAmount ??
      0
  );

  const grandTotal = Number(
    invoice.totalAmount ??
      invoice.grandTotal ??
      invoice.totalPrice ??
      invoice.payableAmount ??
      subtotal + shipping + vat - discount
  );

  const paidAmount = Number(
    invoice.paidAmount ??
      (String(invoice.status || "").toLowerCase() === "paid"
        ? grandTotal
        : 0)
  );

  const dueAmount = Math.max(
    Number(invoice.dueAmount ?? grandTotal - paidAmount),
    0
  );

  const status = String(
    invoice.status ||
      invoice.paymentStatus ||
      "unpaid"
  ).toLowerCase();

  const paymentMethod =
    invoice.paymentMethod ||
    invoice.payment?.method ||
    invoice.transaction?.method ||
    "Cash on Delivery";

  const orderCode =
    invoice.orderNumber ||
    invoice.orderCode ||
    invoice.orderId?._id ||
    invoice.orderId ||
    "—";

  const customer = getCustomer();
  const invoiceCode = getInvoiceCode();

  const statusClass = [
    "paid",
    "unpaid",
    "partial",
    "refunded",
    "void",
    "cancelled",
  ].includes(status)
    ? status
    : "unpaid";

  const itemRows = items
    .map(
      (item, index) => `
        <tr>
          <td class="serial">${index + 1}</td>

          <td>
            <div class="product-name">
              ${escapeHtml(item.name)}
            </div>

            ${
              item.sku
                ? `<div class="product-meta">
                    SKU: ${escapeHtml(item.sku)}
                   </div>`
                : ""
            }

            ${
              item.variation
                ? `<div class="product-meta">
                    ${escapeHtml(item.variation)}
                   </div>`
                : ""
            }
          </td>

          <td class="text-center">
            ${item.quantity}
          </td>

          <td class="text-right">
            ${currency(item.unitPrice)}
          </td>

          <td class="text-right line-total">
            ${currency(item.lineTotal)}
          </td>
        </tr>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>${escapeHtml(invoiceCode)} | Kroykori Mart</title>

        <style>
          :root {
            --brand: ${brand.color};
            --secondary: ${brand.secondaryColor};
            --text: #0f172a;
            --muted: #64748b;
            --border: #e2e8f0;
            --light: #f8fafc;
            --white: #ffffff;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #eef2ff;
            color: var(--text);
            font-family:
              Inter,
              ui-sans-serif,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          body {
            padding: 28px;
          }

          .invoice {
            width: 100%;
            max-width: 900px;
            min-height: 1100px;
            margin: 0 auto;
            overflow: hidden;
            background: var(--white);
            border-radius: 20px;
            box-shadow: 0 18px 60px rgba(15, 23, 42, 0.12);
          }

          .top-bar {
            height: 9px;
            background:
              linear-gradient(
                90deg,
                var(--brand),
                #7c3aed,
                #06b6d4
              );
          }

          .invoice-body {
            padding: 34px 38px;
          }

          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 30px;
            padding-bottom: 25px;
            border-bottom: 1px solid var(--border);
          }

          .brand-wrapper {
            display: flex;
            align-items: flex-start;
            gap: 16px;
          }

          .logo-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 86px;
            height: 72px;
            padding: 8px;
            overflow: hidden;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 14px;
          }

          .logo {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .company-name {
            margin: 0 0 4px;
            color: var(--secondary);
            font-size: 24px;
            font-weight: 800;
          }

          .slogan {
            margin: 0 0 9px;
            color: var(--brand);
            font-size: 12px;
            font-weight: 700;
          }

          .company-info {
            margin: 3px 0;
            color: var(--muted);
            font-size: 11px;
            line-height: 1.5;
          }

          .invoice-title-box {
            min-width: 230px;
            text-align: right;
          }

          .invoice-title {
            margin: 0;
            color: var(--secondary);
            font-size: 34px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .invoice-code {
            margin-top: 4px;
            color: var(--brand);
            font-size: 14px;
            font-weight: 800;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 11px;
            padding: 6px 14px;
            border: 1px solid;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          .paid {
            color: #047857;
            background: #d1fae5;
            border-color: #a7f3d0;
          }

          .unpaid {
            color: #b45309;
            background: #fef3c7;
            border-color: #fde68a;
          }

          .partial {
            color: #4338ca;
            background: #e0e7ff;
            border-color: #c7d2fe;
          }

          .refunded,
          .void,
          .cancelled {
            color: #be123c;
            background: #ffe4e6;
            border-color: #fecdd3;
          }

          .information-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-top: 24px;
          }

          .information-card {
            padding: 18px;
            background: var(--light);
            border: 1px solid var(--border);
            border-radius: 14px;
          }

          .card-label {
            margin: 0 0 11px;
            color: var(--brand);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }

          .info-row {
            display: grid;
            grid-template-columns: 105px 1fr;
            gap: 8px;
            margin-top: 6px;
            font-size: 12px;
          }

          .info-label {
            color: var(--muted);
          }

          .info-value {
            color: var(--text);
            font-weight: 650;
            overflow-wrap: anywhere;
          }

          .section-heading {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 28px 0 12px;
            color: var(--secondary);
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.7px;
            text-transform: uppercase;
          }

          .section-heading::after {
            flex: 1;
            height: 1px;
            background: var(--border);
            content: "";
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }

          .items-table {
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 13px;
          }

          .items-table thead th {
            padding: 11px 12px;
            color: #ffffff;
            background: var(--secondary);
            font-size: 10px;
            font-weight: 800;
            text-align: left;
            letter-spacing: 0.4px;
            text-transform: uppercase;
          }

          .items-table tbody td {
            padding: 13px 12px;
            border-bottom: 1px solid var(--border);
            font-size: 11px;
            vertical-align: top;
          }

          .items-table tbody tr:last-child td {
            border-bottom: none;
          }

          .items-table tbody tr:nth-child(even) {
            background: #fafafa;
          }

          .serial {
            width: 45px;
            color: var(--muted);
          }

          .product-name {
            color: var(--text);
            font-size: 12px;
            font-weight: 750;
          }

          .product-meta {
            margin-top: 3px;
            color: var(--muted);
            font-size: 10px;
          }

          .text-center {
            text-align: center !important;
          }

          .text-right {
            text-align: right !important;
          }

          .line-total {
            color: var(--secondary);
            font-weight: 800;
          }

          .summary-area {
            display: grid;
            grid-template-columns: 1fr 330px;
            gap: 28px;
            align-items: start;
            margin-top: 22px;
          }

          .payment-card {
            padding: 18px;
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 14px;
          }

          .payment-card h4 {
            margin: 0 0 10px;
            color: var(--secondary);
            font-size: 12px;
          }

          .payment-card p {
            margin: 5px 0;
            color: var(--muted);
            font-size: 11px;
          }

          .totals-card {
            padding: 18px;
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 14px;
          }

          .totals-table td {
            padding: 7px 0;
            border: none;
            color: var(--muted);
            font-size: 12px;
          }

          .totals-table td:last-child {
            color: var(--text);
            font-weight: 700;
            text-align: right;
          }

          .discount-row td:last-child {
            color: #dc2626;
          }

          .grand-total-row td {
            padding-top: 13px;
            color: var(--secondary) !important;
            border-top: 2px solid var(--brand);
            font-size: 15px;
            font-weight: 900 !important;
          }

          .due-row td {
            color: #be123c !important;
            font-weight: 800 !important;
          }

          .terms {
            margin-top: 28px;
            padding: 15px 17px;
            color: var(--muted);
            background: #f8fafc;
            border-left: 4px solid var(--brand);
            border-radius: 8px;
            font-size: 10px;
          }

          .terms strong {
            color: var(--secondary);
          }

          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 70px;
            margin-top: 58px;
          }

          .signature {
            padding-top: 8px;
            color: var(--muted);
            border-top: 1px solid #94a3b8;
            font-size: 10px;
            text-align: center;
          }

          .footer {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-top: 35px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
          }

          .thank-you {
            margin: 0;
            color: var(--secondary);
            font-size: 13px;
            font-weight: 800;
          }

          .footer-text {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 10px;
          }

          .website {
            color: var(--brand);
            font-size: 11px;
            font-weight: 800;
            text-align: right;
          }

          @media print {
            @page {
              size: A4;
              margin: 9mm;
            }

            html,
            body {
              width: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .invoice {
              width: 100%;
              max-width: none;
              min-height: auto;
              margin: 0;
              border-radius: 0;
              box-shadow: none;
            }

            .invoice-body {
              padding: 20px 24px;
            }

            .header {
              padding-bottom: 18px;
            }

            .information-grid {
              margin-top: 18px;
            }

            .section-heading {
              margin-top: 20px;
            }

            .items-table tbody td {
              padding-top: 9px;
              padding-bottom: 9px;
            }

            .summary-area {
              margin-top: 17px;
            }

            .terms {
              margin-top: 20px;
            }

            .signatures {
              margin-top: 46px;
            }

            .footer {
              margin-top: 25px;
            }
          }
        </style>
      </head>

      <body>
        <main class="invoice">
          <div class="top-bar"></div>

          <div class="invoice-body">
            <header class="header">
              <div class="brand-wrapper">
                <div class="logo-box">
                  <img
                    class="logo"
                    src="${escapeHtml(absoluteUrl(brand.logo))}"
                    alt="${escapeHtml(brand.name)} logo"
                  />
                </div>

                <div>
                  <h1 class="company-name">
                    ${escapeHtml(brand.name)}
                  </h1>

                  ${
                    brand.slogan
                      ? `<p class="slogan">
                          ${escapeHtml(brand.slogan)}
                         </p>`
                      : ""
                  }

                  <p class="company-info">
                    ${escapeHtml(brand.address)}
                  </p>

                  <p class="company-info">
                    ${escapeHtml(brand.phone)}
                    &nbsp;•&nbsp;
                    ${escapeHtml(brand.email)}
                  </p>

                  <p class="company-info">
                    ${escapeHtml(brand.openingHours)}
                  </p>
                </div>
              </div>

              <div class="invoice-title-box">
                <h2 class="invoice-title">Invoice</h2>

                <div class="invoice-code">
                  #${escapeHtml(invoiceCode)}
                </div>

                <span class="status-badge ${statusClass}">
                  ${escapeHtml(status)}
                </span>
              </div>
            </header>

            <section class="information-grid">
              <div class="information-card">
                <p class="card-label">Invoice Details</p>

                <div class="info-row">
                  <span class="info-label">Invoice No.</span>
                  <span class="info-value">
                    ${escapeHtml(invoiceCode)}
                  </span>
                </div>

                <div class="info-row">
                  <span class="info-label">Order ID</span>
                  <span class="info-value">
                    ${escapeHtml(String(orderCode))}
                  </span>
                </div>

                <div class="info-row">
                  <span class="info-label">Issued Date</span>
                  <span class="info-value">
                    ${escapeHtml(
                      formatDate(
                        invoice.issuedAt ||
                          invoice.createdAt
                      )
                    )}
                  </span>
                </div>

                <div class="info-row">
                  <span class="info-label">Payment</span>
                  <span class="info-value">
                    ${escapeHtml(paymentMethod)}
                  </span>
                </div>
              </div>

              <div class="information-card">
                <p class="card-label">Bill To</p>

                <div class="info-row">
                  <span class="info-label">Customer</span>
                  <span class="info-value">
                    ${escapeHtml(customer.name)}
                  </span>
                </div>

                <div class="info-row">
                  <span class="info-label">Mobile</span>
                  <span class="info-value">
                    ${escapeHtml(customer.mobile)}
                  </span>
                </div>

                ${
                  customer.email !== "—"
                    ? `
                      <div class="info-row">
                        <span class="info-label">Email</span>
                        <span class="info-value">
                          ${escapeHtml(customer.email)}
                        </span>
                      </div>
                    `
                    : ""
                }

                <div class="info-row">
                  <span class="info-label">Address</span>
                  <span class="info-value">
                    ${escapeHtml(customer.address)}
                  </span>
                </div>
              </div>
            </section>

            <h3 class="section-heading">Order Items</h3>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 45px">#</th>
                  <th>Description</th>
                  <th class="text-center" style="width: 65px">
                    Qty
                  </th>
                  <th class="text-right" style="width: 120px">
                    Unit Price
                  </th>
                  <th class="text-right" style="width: 125px">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                ${
                  itemRows ||
                  `
                    <tr>
                      <td
                        colspan="5"
                        class="text-center"
                        style="padding: 30px; color: #64748b"
                      >
                        No invoice items found
                      </td>
                    </tr>
                  `
                }
              </tbody>
            </table>

            <section class="summary-area">
              <div class="payment-card">
                <h4>Payment Information</h4>

                <p>
                  Method:
                  <strong>
                    ${escapeHtml(paymentMethod)}
                  </strong>
                </p>

                <p>
                  Payment status:
                  <strong>
                    ${escapeHtml(status.toUpperCase())}
                  </strong>
                </p>

                <p>
                  This invoice was generated electronically
                  by Kroykori Mart.
                </p>
              </div>

              <div class="totals-card">
                <table class="totals-table">
                  <tbody>
                    <tr>
                      <td>Subtotal</td>
                      <td>${currency(subtotal)}</td>
                    </tr>

                    <tr>
                      <td>Shipping charge</td>
                      <td>${currency(shipping)}</td>
                    </tr>

                    ${
                      discount > 0
                        ? `
                          <tr class="discount-row">
                            <td>Discount</td>
                            <td>− ${currency(discount)}</td>
                          </tr>
                        `
                        : ""
                    }

                    ${
                      vat > 0
                        ? `
                          <tr>
                            <td>VAT / Tax</td>
                            <td>${currency(vat)}</td>
                          </tr>
                        `
                        : ""
                    }

                    <tr class="grand-total-row">
                      <td>Grand Total</td>
                      <td>${currency(grandTotal)}</td>
                    </tr>

                    ${
                      paidAmount > 0
                        ? `
                          <tr>
                            <td>Paid Amount</td>
                            <td>${currency(paidAmount)}</td>
                          </tr>
                        `
                        : ""
                    }

                    ${
                      dueAmount > 0
                        ? `
                          <tr class="due-row">
                            <td>Due Amount</td>
                            <td>${currency(dueAmount)}</td>
                          </tr>
                        `
                        : ""
                    }
                  </tbody>
                </table>
              </div>
            </section>

            <div class="terms">
              <strong>Terms & Conditions:</strong>
              Products can be returned or replaced according to
              Kroykori Mart's return policy. Please keep this invoice
              for return, replacement, warranty and support.
            </div>

            <section class="signatures">
              <div class="signature">
                Authorized Signature
              </div>

              <div class="signature">
                Customer Signature
              </div>
            </section>

            <footer class="footer">
              <div>
                <p class="thank-you">
                  Thank you for shopping with Kroykori Mart!
                </p>

                <p class="footer-text">
                  For assistance, contact
                  ${escapeHtml(brand.phone)}
                </p>
              </div>

              <div class="website">
                ${escapeHtml(brand.website)}
              </div>
            </footer>
          </div>
        </main>

        <script>
          const printAfterImagesLoad = async () => {
            const images = Array.from(document.images);

            await Promise.all(
              images.map((image) => {
                if (image.complete) {
                  return Promise.resolve();
                }

                return new Promise((resolve) => {
                  image.onload = resolve;
                  image.onerror = resolve;
                });
              })
            );

            setTimeout(() => {
              window.focus();
              window.print();
            }, 350);
          };

          window.addEventListener("load", printAfterImagesLoad);
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open(
    "",
    "_blank",
    "width=1000,height=900,left=100,top=50"
  );

  if (!printWindow) {
    alert(
      "Print window was blocked. Please allow pop-ups for this website."
    );
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}