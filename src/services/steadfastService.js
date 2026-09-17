import axios from "axios";

const getBaseUrl = () => {
  const base = import.meta.env.VITE_APP_SERVER_URL || "";
  return base.endsWith("/") ? base : `${base}/`;
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const bookSteadfastParcel = async (orderId) => {
  const url = getBaseUrl();

  const res = await axios.post(
    `${url}api/orders/${orderId}/steadfast/book`,
    {},
    { headers: getAuthHeaders() }
  );

  return res.data;
};

export const trackSteadfastParcel = async (orderId) => {
  const url = getBaseUrl();

  const res = await axios.get(
    `${url}api/orders/${orderId}/steadfast/track`,
    { headers: getAuthHeaders() }
  );

  return res.data;
};

export const cancelSteadfastParcel = async (orderId) => {
  const url = getBaseUrl();

  const res = await axios.post(
    `${url}api/orders/${orderId}/steadfast/cancel`,
    {},
    { headers: getAuthHeaders() }
  );

  return res.data;
};