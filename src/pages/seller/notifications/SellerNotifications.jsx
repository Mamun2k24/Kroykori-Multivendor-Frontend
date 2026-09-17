import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiLoader,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_URL = String(
  import.meta.env.VITE_APP_SERVER_URL || "",
).replace(/\/+$/, "");

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
};

const typeStyles = {
  order: {
    icon: FiPackage,
    className:
      "bg-blue-100 text-blue-600",
  },
  delivery: {
    icon: FiTruck,
    className:
      "bg-violet-100 text-violet-600",
  },
  payment: {
    icon: FiCreditCard,
    className:
      "bg-emerald-100 text-emerald-600",
  },
  payout: {
    icon: FiCreditCard,
    className:
      "bg-orange-100 text-orange-600",
  },
  product: {
    icon: FiPackage,
    className:
      "bg-cyan-100 text-cyan-600",
  },
  return: {
    icon: FiRefreshCw,
    className:
      "bg-amber-100 text-amber-600",
  },
  system: {
    icon: FiBell,
    className:
      "bg-slate-100 text-slate-600",
  },
};

const SellerNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState([]);

  const [filter, setFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState("");

  const [markingAll, setMarkingAll] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] =
    useState("");

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

  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await request(
          "/api/notifications",
        );

        setNotifications(
          Array.isArray(data?.notifications)
            ? data.notifications
            : Array.isArray(data)
              ? data
              : [],
        );
      } catch (err) {
        setNotifications([]);

        setError(
          err.message ||
            "Notifications load করতে সমস্যা হয়েছে।",
        );
      } finally {
        setLoading(false);
      }
    }, [request]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.isRead,
      ).length,
    [notifications],
  );

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => {
          if (filter === "unread") {
            return !notification.isRead;
          }

          if (filter === "read") {
            return notification.isRead;
          }

          return true;
        },
      ),
    [notifications, filter],
  );

  const markAsRead = async (
    notification,
    shouldNavigate = false,
  ) => {
    try {
      if (!notification.isRead) {
        setUpdatingId(notification._id);

        await request(
          `/api/notifications/${notification._id}/read`,
          {
            method: "PATCH",
          },
        );

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );
      }

      if (
        shouldNavigate &&
        notification.actionUrl
      ) {
        navigate(notification.actionUrl);
      }
    } catch (err) {
      setError(
        err.message ||
          "Notification update করা যায়নি।",
      );
    } finally {
      setUpdatingId("");
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setMarkingAll(true);
      setError("");
      setSuccess("");

      const data = await request(
        "/api/notifications/mark-all-read",
        {
          method: "PATCH",
        },
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setSuccess(
        data?.message ||
          "All notifications marked as read",
      );
    } catch (err) {
      setError(
        err.message ||
          "Notifications update করা যায়নি।",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Orders, products, returns এবং
            payouts-এর updates।
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={
              markingAll || unreadCount === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? (
              <FiLoader className="animate-spin" />
            ) : (
              <FiCheckCircle />
            )}
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>

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
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Filters */}

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {[
          {
            value: "all",
            label: `All (${notifications.length})`,
          },
          {
            value: "unread",
            label: `Unread (${unreadCount})`,
          },
          {
            value: "read",
            label: "Read",
          },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              setFilter(item.value)
            }
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              filter === item.value
                ? "bg-orange-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* List */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <FiLoader className="mx-auto animate-spin text-4xl text-orange-500" />

              <p className="mt-3 text-sm text-slate-500">
                Notifications loading...
              </p>
            </div>
          </div>
        ) : visibleNotifications.length ===
          0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
            <FiBell className="text-5xl text-slate-300" />

            <h3 className="mt-4 font-bold text-slate-800">
              No notifications
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              এই filter-এর কোনো notification
              পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleNotifications.map(
              (notification) => {
                const type =
                  typeStyles[
                    notification.type
                  ] || typeStyles.system;

                const Icon = type.icon;

                return (
                  <article
                    key={notification._id}
                    className={`flex gap-4 p-5 transition ${
                      notification.isRead
                        ? "bg-white"
                        : "bg-orange-50/60"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${type.className}`}
                    >
                      <Icon className="text-xl" />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        markAsRead(
                          notification,
                          true,
                        )
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2
                          className={`font-semibold ${
                            notification.isRead
                              ? "text-slate-700"
                              : "text-slate-900"
                          }`}
                        >
                          {notification.title}
                        </h2>

                        {!notification.isRead && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
                        )}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(
                          notification.createdAt,
                        )}
                      </p>
                    </button>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() =>
                          markAsRead(
                            notification,
                          )
                        }
                        disabled={
                          updatingId ===
                          notification._id
                        }
                        title="Mark as read"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {updatingId ===
                        notification._id ? (
                          <FiLoader className="animate-spin" />
                        ) : (
                          <FiCheck />
                        )}
                      </button>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default SellerNotifications;