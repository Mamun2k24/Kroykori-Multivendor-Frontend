import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiLoader,
  FiRefreshCw,
  FiRotateCcw,
  FiTrendingUp,
  FiX,
} from "react-icons/fi";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const MIN_WITHDRAWAL = 100;

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
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  available:
    "bg-emerald-100 text-emerald-700",
  paid: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const initialPaymentMethod = {
  method: "bkash",
  accountName: "",
  accountNumber: "",
  bankName: "",
  branchName: "",
  routingNumber: "",
};

const SellerWallet = () => {
  const [walletData, setWalletData] =
    useState(null);

  const [withdrawals, setWithdrawals] =
    useState([]);

  const [paymentForm, setPaymentForm] =
    useState(initialPaymentMethod);

  const [withdrawalForm, setWithdrawalForm] =
    useState({
      amount: "",
      sellerNote: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [paymentSaving, setPaymentSaving] =
    useState(false);

  const [
    withdrawalSaving,
    setWithdrawalSaving,
  ] = useState(false);

  const [cancellingId, setCancellingId] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

  const wallet = walletData?.wallet || {};
  const transactions =
    walletData?.recentTransactions || [];

  const request = useCallback(
    async (path, options = {}) => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found",
        );
      }

      const response = await fetch(
        `${API_URL}${path}`,
        {
          ...options,
          headers: {
            ...(options.body
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}),
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
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
            "Request failed",
        );
      }

      return data;
    },
    [],
  );

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [walletResponse, payoutResponse] =
        await Promise.all([
          request("/api/seller/wallet"),
          request(
            "/api/seller/withdrawals",
          ),
        ]);

      setWalletData(walletResponse);

      setWithdrawals(
        Array.isArray(payoutResponse)
          ? payoutResponse
          : [],
      );

      const paymentMethod =
        walletResponse?.paymentMethod;

      if (paymentMethod) {
        setPaymentForm({
          method:
            paymentMethod.method || "bkash",
          accountName:
            paymentMethod.accountName || "",
          accountNumber:
            paymentMethod.accountNumber || "",
          bankName:
            paymentMethod.bankName || "",
          branchName:
            paymentMethod.branchName || "",
          routingNumber:
            paymentMethod.routingNumber || "",
        });
      }
    } catch (err) {
      setError(
        err.message ||
          "Wallet load করতে সমস্যা হয়েছে।",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleWithdrawalChange = (
    event,
  ) => {
    const { name, value } = event.target;

    setWithdrawalForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const savePaymentMethod = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !paymentForm.accountName.trim() ||
      !paymentForm.accountNumber.trim()
    ) {
      setError(
        "Account name এবং account number প্রয়োজন।",
      );
      return;
    }

    if (
      paymentForm.method === "bank" &&
      !paymentForm.bankName.trim()
    ) {
      setError(
        "Bank payment-এর জন্য bank name প্রয়োজন।",
      );
      return;
    }

    try {
      setPaymentSaving(true);
      setError("");
      setSuccess("");

      const data = await request(
        "/api/seller/wallet/payment-method",
        {
          method: "PUT",
          body: JSON.stringify({
            method: paymentForm.method,
            accountName:
              paymentForm.accountName.trim(),
            accountNumber:
              paymentForm.accountNumber.trim(),
            bankName:
              paymentForm.method === "bank"
                ? paymentForm.bankName.trim()
                : "",
            branchName:
              paymentForm.method === "bank"
                ? paymentForm.branchName.trim()
                : "",
            routingNumber:
              paymentForm.method === "bank"
                ? paymentForm.routingNumber.trim()
                : "",
          }),
        },
      );

      setSuccess(
        data?.message ||
          "Payment method updated successfully",
      );

      setWalletData((previous) => ({
        ...previous,
        paymentMethod:
          data?.paymentMethod,
      }));
    } catch (err) {
      setError(
        err.message ||
          "Payment method update করা যায়নি।",
      );
    } finally {
      setPaymentSaving(false);
    }
  };

  const requestWithdrawal = async (
    event,
  ) => {
    event.preventDefault();

    const amount = Number(
      withdrawalForm.amount,
    );

    if (
      !Number.isFinite(amount) ||
      amount < MIN_WITHDRAWAL
    ) {
      setError(
        `Minimum withdrawal amount is ${MIN_WITHDRAWAL}`,
      );
      return;
    }

    if (
      amount >
      Number(wallet.availableBalance || 0)
    ) {
      setError(
        "Insufficient available balance",
      );
      return;
    }

    if (!walletData?.paymentMethod) {
      setError(
        "Withdrawal request করার আগে payment method save করুন।",
      );
      return;
    }

    try {
      setWithdrawalSaving(true);
      setError("");
      setSuccess("");

      const data = await request(
        "/api/seller/withdrawals",
        {
          method: "POST",
          body: JSON.stringify({
            amount,
            sellerNote:
              withdrawalForm.sellerNote.trim(),
          }),
        },
      );

      setSuccess(
        data?.message ||
          "Withdrawal request submitted successfully",
      );

      setWithdrawalForm({
        amount: "",
        sellerNote: "",
      });

      await loadWallet();
    } catch (err) {
      setError(
        err.message ||
          "Withdrawal request করা যায়নি।",
      );
    } finally {
      setWithdrawalSaving(false);
    }
  };

  const cancelWithdrawal = async (id) => {
    const confirmed = window.confirm(
      "এই pending withdrawal request cancel করতে চান?",
    );

    if (!confirmed) return;

    try {
      setCancellingId(id);
      setError("");
      setSuccess("");

      const data = await request(
        `/api/seller/withdrawals/${id}/cancel`,
        {
          method: "PATCH",
        },
      );

      setSuccess(
        data?.message ||
          "Withdrawal request cancelled",
      );

      await loadWallet();
    } catch (err) {
      setError(
        err.message ||
          "Withdrawal cancel করা যায়নি।",
      );
    } finally {
      setCancellingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[450px] items-center justify-center">
        <div className="text-center">
          <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

          <p className="mt-3 text-sm text-slate-500">
            Wallet loading...
          </p>
        </div>
      </div>
    );
  }

  const showBankFields =
    paymentForm.method === "bank";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Wallet
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Earnings, transactions এবং
            withdrawals পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={loadWallet}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <FiRefreshCw />
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

      {/* Wallet cards */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <FiClock className="text-2xl text-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Pending balance
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(wallet.pendingBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <FiDollarSign className="text-2xl text-emerald-600" />

          <p className="mt-4 text-sm text-slate-500">
            Available balance
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {money(wallet.availableBalance)}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
          <FiTrendingUp className="text-2xl text-orange-600" />

          <p className="mt-4 text-sm text-slate-500">
            Total earned
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(wallet.totalEarned)}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
          <FiCreditCard className="text-2xl text-violet-600" />

          <p className="mt-4 text-sm text-slate-500">
            Withdrawal reserved
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {money(
              wallet.withdrawalReserved,
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payment method */}

        <form
          onSubmit={savePaymentMethod}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FiCreditCard className="text-orange-500" />
            Payment Method
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Withdrawal receive করার account
            information।
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Method
              </label>

              <select
                name="method"
                value={paymentForm.method}
                onChange={handlePaymentChange}
                className={inputClass}
              >
                <option value="bkash">
                  bKash
                </option>
                <option value="nagad">
                  Nagad
                </option>
                <option value="rocket">
                  Rocket
                </option>
                <option value="bank">
                  Bank
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account name
              </label>

              <input
                type="text"
                name="accountName"
                value={
                  paymentForm.accountName
                }
                onChange={handlePaymentChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account number
              </label>

              <input
                type="text"
                name="accountNumber"
                value={
                  paymentForm.accountNumber
                }
                onChange={handlePaymentChange}
                className={inputClass}
                required
              />
            </div>

            {showBankFields && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bank name
                  </label>

                  <input
                    type="text"
                    name="bankName"
                    value={
                      paymentForm.bankName
                    }
                    onChange={
                      handlePaymentChange
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Branch name
                  </label>

                  <input
                    type="text"
                    name="branchName"
                    value={
                      paymentForm.branchName
                    }
                    onChange={
                      handlePaymentChange
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Routing number
                  </label>

                  <input
                    type="text"
                    name="routingNumber"
                    value={
                      paymentForm.routingNumber
                    }
                    onChange={
                      handlePaymentChange
                    }
                    className={inputClass}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={paymentSaving}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {paymentSaving && (
              <FiLoader className="animate-spin" />
            )}
            Save Payment Method
          </button>
        </form>

        {/* Withdrawal request */}

        <form
          onSubmit={requestWithdrawal}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FiDollarSign className="text-orange-500" />
            Request Withdrawal
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Minimum withdrawal:{" "}
            {money(MIN_WITHDRAWAL)}
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Withdrawal amount
              </label>

              <input
                type="number"
                name="amount"
                min={MIN_WITHDRAWAL}
                max={
                  Number(
                    wallet.availableBalance,
                  ) || undefined
                }
                value={
                  withdrawalForm.amount
                }
                onChange={
                  handleWithdrawalChange
                }
                placeholder="Enter amount"
                className={inputClass}
                required
              />

              <button
                type="button"
                onClick={() =>
                  setWithdrawalForm(
                    (previous) => ({
                      ...previous,
                      amount: String(
                        wallet.availableBalance ||
                          "",
                      ),
                    }),
                  )
                }
                className="mt-2 text-xs font-semibold text-orange-600"
              >
                Withdraw maximum available
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Note
              </label>

              <textarea
                name="sellerNote"
                rows={4}
                value={
                  withdrawalForm.sellerNote
                }
                onChange={
                  handleWithdrawalChange
                }
                placeholder="Optional withdrawal note"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={
              withdrawalSaving ||
              Number(wallet.availableBalance) <
                MIN_WITHDRAWAL
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {withdrawalSaving && (
              <FiLoader className="animate-spin" />
            )}
            Submit Withdrawal Request
          </button>
        </form>
      </div>

      {/* Withdrawal history */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Withdrawal History
          </h2>
        </div>

        {withdrawals.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            কোনো withdrawal request পাওয়া
            যায়নি।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Date
                  </th>
                  <th className="px-5 py-4">
                    Method
                  </th>
                  <th className="px-5 py-4">
                    Account
                  </th>
                  <th className="px-5 py-4">
                    Amount
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {withdrawals.map(
                  (withdrawal) => (
                    <tr key={withdrawal._id}>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDate(
                          withdrawal.createdAt,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold capitalize text-slate-700">
                        {withdrawal
                          .paymentMethod
                          ?.method || "N/A"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {withdrawal
                            .paymentMethod
                            ?.accountName ||
                            "N/A"}
                        </p>

                        <p className="text-xs text-slate-500">
                          {withdrawal
                            .paymentMethod
                            ?.accountNumber ||
                            ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-900">
                        {money(
                          withdrawal.amount,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            statusStyles[
                              withdrawal.status
                            ] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {withdrawal.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {withdrawal.status ===
                        "pending" ? (
                          <button
                            type="button"
                            onClick={() =>
                              cancelWithdrawal(
                                withdrawal._id,
                              )
                            }
                            disabled={
                              cancellingId ===
                              withdrawal._id
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancellingId ===
                            withdrawal._id ? (
                              <FiLoader className="animate-spin" />
                            ) : (
                              <FiRotateCcw />
                            )}
                            Cancel
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent transactions */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Transactions
          </h2>
        </div>

        {transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            কোনো transaction পাওয়া যায়নি।
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(
              (transaction) => (
                <div
                  key={transaction._id}
                  className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold capitalize text-slate-800">
                      {transaction.type.replace(
                        /_/g,
                        " ",
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {transaction.description ||
                        "Seller transaction"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(
                        transaction.createdAt,
                      )}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <p
                      className={`font-bold ${
                        transaction.type ===
                          "withdrawal" ||
                        transaction.type ===
                          "refund"
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {transaction.type ===
                        "withdrawal" ||
                      transaction.type ===
                        "refund"
                        ? "-"
                        : "+"}
                      {money(
                        transaction.amount,
                      )}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        statusStyles[
                          transaction.status
                        ] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SellerWallet;