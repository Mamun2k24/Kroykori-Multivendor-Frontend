import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Filter,
  Inbox,
  RefreshCw,
  Trash2 
} from "lucide-react";

const API_BASE = (
  import.meta.env.VITE_APP_SERVER_URL || ""
).replace(/\/+$/, "");

const apiUrl = (path) =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "order", label: "Orders" },
  { value: "payment", label: "Payments" },
  { value: "delivery", label: "Delivery" },
  { value: "seller", label: "Sellers" },
  { value: "product", label: "Products" },
  { value: "payout", label: "Payouts" },
  { value: "return", label: "Returns" },
  { value: "system", label: "System" },
];

const TYPE_STYLES = {
  order: "bg-blue-100 text-blue-700",
  payment: "bg-emerald-100 text-emerald-700",
  delivery: "bg-cyan-100 text-cyan-700",
  seller: "bg-violet-100 text-violet-700",
  product: "bg-orange-100 text-orange-700",
  payout: "bg-green-100 text-green-700",
  return: "bg-rose-100 text-rose-700",
  system: "bg-slate-100 text-slate-700",
};

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const formatDate = (date) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const AdminNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] =
    useState("all");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [processingId, setProcessingId] =
    useState(null);

  const token = localStorage.getItem("token");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  const loadNotifications = useCallback(async () => {
    if (!token) {
      toast.error("Admin login required");
      return;
    }

    try {
      setLoading(true);

      const [notificationResponse, countResponse] =
        await Promise.all([
          fetch(apiUrl("/api/notifications"), {
            headers: authHeaders,
          }),
          fetch(
            apiUrl("/api/notifications/unread-count"),
            {
              headers: authHeaders,
            },
          ),
        ]);

      const notificationData =
        await notificationResponse.json();

      const countData = await countResponse.json();

      if (!notificationResponse.ok) {
        throw new Error(
          notificationData?.message ||
            "Failed to load notifications",
        );
      }

      const items = Array.isArray(notificationData)
        ? notificationData
        : notificationData?.notifications ||
          notificationData?.items ||
          [];

      setNotifications(items);

      if (countResponse.ok) {
        setUnreadCount(Number(countData?.count || 0));
      } else {
        setUnreadCount(
          items.filter((item) => !item.isRead).length,
        );
      }
    } catch (error) {
      console.error(
        "loadNotifications error:",
        error,
      );
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const typeMatch =
        activeFilter === "all" ||
        (activeFilter === "unread"
          ? !notification.isRead
          : notification.type === activeFilter);

      const priorityMatch =
        priorityFilter === "all" ||
        notification.priority === priorityFilter;

      return typeMatch && priorityMatch;
    });
  }, [
    notifications,
    activeFilter,
    priorityFilter,
  ]);

  const markAsRead = async (
    notification,
    shouldNavigate = false,
  ) => {
    try {
      setProcessingId(notification._id);

      if (!notification.isRead) {
        const response = await fetch(
          apiUrl(
            `/api/notifications/${notification._id}/read`,
          ),
          {
            method: "PATCH",
            headers: authHeaders,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to update notification",
          );
        }

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        setUnreadCount((count) =>
          Math.max(0, count - 1),
        );
      }

      if (
        shouldNavigate &&
        notification.actionUrl
      ) {
        navigate(notification.actionUrl);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);

      const response = await fetch(
        apiUrl("/api/notifications/mark-all-read"),
        {
          method: "PATCH",
          headers: authHeaders,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to mark notifications",
        );
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (
    notificationId,
  ) => {
    const confirmed = window.confirm(
      "এই notification delete করতে চান?",
    );

    if (!confirmed) return;

    try {
      setProcessingId(notificationId);

      const response = await fetch(
        apiUrl(
          `/api/notifications/${notificationId}`,
        ),
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete notification",
        );
      }

      const deletedNotification =
        notifications.find(
          (item) =>
            item._id === notificationId,
        );

      setNotifications((current) =>
        current.filter(
          (item) =>
            item._id !== notificationId,
        ),
      );

      if (
        deletedNotification &&
        !deletedNotification.isRead
      ) {
        setUnreadCount((count) =>
          Math.max(0, count - 1),
        );
      }

      toast.success(
        "Notification deleted successfully",
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
              <Bell size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Admin Notifications
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Marketplace-এর গুরুত্বপূর্ণ updates
                দেখুন।
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={
              markingAll || unreadCount === 0
            }
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={17} />
            Mark all read
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total notifications
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm text-orange-700">
            Unread notifications
          </p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Filtered results
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {filteredNotifications.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  setActiveFilter(filter.value)
                }
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === filter.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <Filter
              size={17}
              className="text-slate-500"
            />

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
            >
              <option value="all">
                All priorities
              </option>
              <option value="high">
                High priority
              </option>
              <option value="medium">
                Medium priority
              </option>
              <option value="low">
                Low priority
              </option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <RefreshCw className="animate-spin text-orange-600" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <Inbox
              size={48}
              className="text-slate-300"
            />
            <h3 className="mt-4 font-semibold text-slate-800">
              No notifications found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              এই filter-এর অধীনে কোনো notification
              নেই।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(
              (notification) => (
                <article
                  key={notification._id}
                  className={`group flex gap-3 p-4 transition hover:bg-slate-50 sm:p-5 ${
                    notification.isRead
                      ? "bg-white"
                      : "bg-orange-50/60"
                  }`}
                >
                  <div
                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      TYPE_STYLES[
                        notification.type
                      ] ||
                      TYPE_STYLES.system
                    }`}
                  >
                    <Bell size={18} />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      markAsRead(notification, true)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm text-slate-900 ${
                          notification.isRead
                            ? "font-medium"
                            : "font-bold"
                        }`}
                      >
                        {notification.title}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          TYPE_STYLES[
                            notification.type
                          ] ||
                          TYPE_STYLES.system
                        }`}
                      >
                        {notification.type || "system"}
                      </span>

                      {notification.priority && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            PRIORITY_STYLES[
                              notification.priority
                            ] ||
                            PRIORITY_STYLES.low
                          }`}
                        >
                          {notification.priority}
                        </span>
                      )}

                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        {formatDate(
                          notification.createdAt,
                        )}
                      </span>

                      {notification.sender?.name && (
                        <span>
                          From:{" "}
                          {notification.sender.name}
                        </span>
                      )}
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    {!notification.isRead && (
                      <button
                        type="button"
                        title="Mark as read"
                        disabled={
                          processingId ===
                          notification._id
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          markAsRead(notification);
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-600 disabled:opacity-50"
                      >
                        <Check size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete notification"
                      disabled={
                        processingId ===
                        notification._id
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteNotification(
                          notification._id,
                        );
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>

                    {notification.actionUrl && (
                      <ChevronRight
                        size={19}
                        className="text-slate-400"
                      />
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminNotifications;