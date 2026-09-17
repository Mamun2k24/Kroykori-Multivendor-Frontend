import axios from "axios";

const useAxiosSecure = () => {
  const axiosSecure = axios.create({
    baseURL: import.meta.env.VITE_APP_SERVER_URL,
    withCredentials: true, // সেশন/কুকি-ভিত্তিক অথেন্টিকেশনের জন্য প্রয়োজনীয়
  });

  // Request Interceptor: প্রতি রিকোয়েস্টের আগে টোকেন আপডেট করা
  axiosSecure.interceptors.request.use(
    (config) => {
      // আপনার অ্যাপে টোকেনের কি (key) নাম চেক করুন: "access-token" বা "token"
      const token =
        localStorage.getItem("access-token") || localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return axiosSecure;
};

export default useAxiosSecure;