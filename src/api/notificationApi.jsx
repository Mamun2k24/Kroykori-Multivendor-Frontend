import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_APP_SERVER_URL}api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getNotifications = () => API.get("/notifications");
export const getUnreadCount = () => API.get("/notifications/unread-count");
export const markAsRead = (id) => API.patch(`/notifications/${id}/read`);