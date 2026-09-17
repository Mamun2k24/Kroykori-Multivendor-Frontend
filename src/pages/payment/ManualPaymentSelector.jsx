import { useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

const PAYMENT_ACCOUNTS = {
  bKash: import.meta.env.VITE_BKASH_PAYMENT_NUMBER || "",
  Nagad: import.meta.env.VITE_NAGAD_PAYMENT_NUMBER || "",
};

const PAYMENT_METHODS = [
  {
    name: "Cash on Delivery",
    shortName: "Cash on Delivery",
    description: "পণ্য হাতে পেয়ে টাকা দিন",
    icon: null,
    fallback: "৳",
    accent: "emerald",
  },
  {
    name: "bKash",
    shortName: "bKash",
    description: "আগে পেমেন্ট করুন",
    icon: "/bkash-logo.png",
    fallback: "bK",
    accent: "pink",
  },
  {
    name: "Nagad",
    shortName: "Nagad",
    description: "আগে পেমেন্ট করুন",
    icon: "/nagad-logo.png",
    fallback: "N",
    accent: "orange",
  },
];

const ACCENT_STYLES = {
  emerald: "bg-emerald-50 text-emerald-600",
  pink: "bg-pink-50 text-pink-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function ManualPaymentSelector({
  paymentMethod,
  setPaymentMethod,
  manualPayment,
  setManualPayment,
  totalAmount,
}) {
  const [copied, setCopied] = useState(false);
  const isManual = ["bKash", "Nagad"].includes(paymentMethod);
  const receiver = PAYMENT_ACCOUNTS[paymentMethod] || "";
  const formattedAmount = Number(totalAmount || 0).toLocaleString("en-BD");

  const chooseMethod = (method) => {
    setPaymentMethod(method);
    setManualPayment({ senderNumber: "", transactionId: "" });
    setCopied(false);
  };

  const copyReceiver = async () => {
    if (!receiver) return;

    try {
      await navigator.clipboard.writeText(receiver);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <fieldset className="min-w-0 w-full max-w-full space-y-5">
      <legend className="sr-only">Payment method</legend>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        {PAYMENT_METHODS.map((method) => {
          const selected = paymentMethod === method.name;

          return (
            <label
              key={method.name}
              className={`relative min-w-0 flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border-2 px-2 py-2.5 transition-all duration-200 ${
                selected
                  ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.name}
                checked={selected}
                onChange={() => chooseMethod(method.name)}
                className="sr-only"
              />

              {selected && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}

              <span
                className={`flex h-9 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg ${ACCENT_STYLES[method.accent]}`}
              >
                {method.icon ? (
                  <img
                    src={method.icon}
                    alt={`${method.name} logo`}
                    className="h-full w-full object-contain p-1.5"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                      event.currentTarget.nextElementSibling.hidden = false;
                    }}
                  />
                ) : null}
                <span hidden={Boolean(method.icon)} className="text-sm font-black">
                  {method.fallback}
                </span>
              </span>

              <span className="min-w-0 pr-3">
                <span className="block text-sm font-extrabold leading-5 text-slate-900">
                  {method.shortName}
                </span>
                <span className="block truncate text-[11px] leading-4 text-slate-500">
                  {method.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {isManual && (
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
            <p className="text-xs font-medium text-indigo-100">
              {paymentMethod}-এ সঠিক পরিমাণ পাঠান
            </p>
            <p className="mt-1 text-2xl font-black">৳{formattedAmount}</p>
          </div>

          <div className="min-w-0 space-y-5 p-4 sm:p-5">
            <div className="grid min-w-0 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {[
                ["১", `${paymentMethod} অ্যাপ খুলুন`],
                ["২", "Send Money নির্বাচন করুন"],
                ["৩", "TrxID নিচে লিখুন"],
              ].map(([step, text]) => (
                <div key={step} className="min-w-0 flex items-center gap-2.5 text-xs text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                    {step}
                  </span>
                  <span className="min-w-0 break-words">{text}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Send Money নম্বর
              </p>
              <div className="mt-1 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <strong className="min-w-0 max-w-full break-all text-base tracking-wide text-slate-900 sm:text-lg">
                  {receiver || "Payment number configured নয়"}
                </strong>
                <button
                  type="button"
                  onClick={copyReceiver}
                  disabled={!receiver}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="min-w-0 space-y-1.5">
                <span className="text-xs font-bold text-slate-700">
                  যে নম্বর থেকে পাঠিয়েছেন
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={manualPayment.senderNumber}
                  onChange={(event) =>
                    setManualPayment((current) => ({
                      ...current,
                      senderNumber: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                  placeholder="01XXXXXXXXX"
                  minLength={11}
                  maxLength={11}
                  required
                  className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </label>

              <label className="min-w-0 space-y-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Transaction ID (TrxID)
                </span>
                <input
                  type="text"
                  value={manualPayment.transactionId}
                  onChange={(event) =>
                    setManualPayment((current) => ({
                      ...current,
                      transactionId: event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, ""),
                    }))
                  }
                  placeholder="যেমন: A1B2C3D4E5"
                  minLength={8}
                  maxLength={30}
                  required
                  className="min-w-0 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </label>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                আপনার PIN বা OTP কখনো লিখবেন না। পেমেন্ট যাচাই হওয়ার পর অর্ডার নিশ্চিত করা হবে।
              </p>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}