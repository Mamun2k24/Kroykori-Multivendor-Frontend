import { useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiClock, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
} from "../api/notificationApi";

const timeAgo = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
  return `${Math.floor(diff / 86400)} day ago`;
};

const getTimeColor = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 3600) return "text-emerald-600";
  if (diff < 86400) return "text-amber-600";
  return "text-slate-400";
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  const prevCountRef = useRef(0);
  const dropdownRef = useRef(null);

  const loadData = async (playSound = false) => {
    try {
      setIsLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);

      const nextNotifications = notificationsRes?.data?.notifications || [];
      const nextCount = countRes?.data?.count || 0;

      setNotifications(nextNotifications);
      setCount(nextCount);

      // Play sound if new notification arrived and audio is available
      if (
        playSound &&
        nextCount > prevCountRef.current &&
        audioRef.current
      ) {
        audioRef.current.play().catch((err) => {
          console.log("Audio play failed:", err); // Silent fail for browsers that block autoplay
        });
      }

      prevCountRef.current = nextCount;
    } catch (err) {
      console.error("Notification load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize audio with the existing sound file
    audioRef.current = new Audio("/notification.mp3");
    // Preload the audio
    audioRef.current.load();

    loadData(false);

    const interval = setInterval(() => {
      loadData(true); // Pass true to enable sound for new notifications
    }, 10000); // Keeping your original 10 second interval

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
      // Clean up audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
      await loadData(false); // Don't play sound when marking as read
    } catch (err) {
      console.error("Mark as read failed:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n => markAsRead(n._id))
      );
      await loadData(false); // Don't play sound when marking all as read
    } catch (err) {
      console.error("Mark all as read failed:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        title="Notifications"
        aria-label="Notifications"
        whileTap={{ scale: 0.95 }}
      >
        <FiBell className="text-[20px] text-slate-600" />

        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-1.5 text-[11px] font-bold text-white shadow-lg"
            >
              {count > 99 ? "99+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <FiCheck className="text-sm" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[420px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 px-5 py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600"></div>
                  <p className="text-sm text-slate-500">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-5 py-16">
                  <div className="rounded-full bg-slate-100 p-4">
                    <FiBell className="text-3xl text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-800">No notifications yet</p>
                    <p className="text-xs text-slate-500 mt-1">We'll notify you when something arrives</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n, index) => (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative cursor-pointer transition-all duration-200 hover:bg-slate-50 ${
                        !n.isRead ? "bg-indigo-50/30" : "bg-white"
                      }`}
                      onClick={(e) => handleRead(n._id, e)}
                    >
                      <div className="flex items-start gap-4 px-5 py-4">
                        {/* Icon based on notification type */}
                        <div className={`shrink-0 rounded-lg p-2 ${
                          !n.isRead 
                            ? "bg-indigo-100 text-indigo-600" 
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {n.type === "alert" ? (
                            <FiBell className="text-lg" />
                          ) : (
                            <FiClock className="text-lg" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${
                              !n.isRead
                                ? "font-semibold text-slate-900"
                                : "font-medium text-slate-700"
                            }`}>
                              {n.title}
                            </p>
                            <span className={`text-xs whitespace-nowrap ${getTimeColor(n.createdAt)}`}>
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                            {n.message}
                          </p>

                          {/* Additional metadata */}
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <FiClock className="text-xs" />
                            <span>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!n.isRead && (
                          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500" />
                        )}

                        {/* Quick actions */}
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRead(n._id, e);
                            }}
                            className="absolute right-3 top-3 rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-indigo-100 transition-all"
                          >
                            <FiCheck className="text-sm text-indigo-600" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                <button 
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg py-2 text-center text-xs font-medium text-slate-600 hover:bg-slate-200/50 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}