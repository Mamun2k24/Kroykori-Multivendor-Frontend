import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API = import.meta.env.VITE_APP_SERVER_URL;

// অথেনটিকেশন হেডার টোকেনসহ
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export default function useGeneralSettings() {
  const qc = useQueryClient();

  // ১. GET: সব সেটিংস ডেটা একসাথে রিড করার জন্য
  const query = useQuery({
    queryKey: ["general-settings"],
    queryFn: async () => {
      const res = await axios.get(`${API}api/settings/general`);
      // ব্যাকএন্ড রেসপন্স { success: true, data: { ... } } থেকে ডিরেক্ট ডেটা অবজেক্টটি পাঠানো হচ্ছে
      return res.data?.data || {}; 
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30, // TanStack Query v5 standard
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ২. PUT: সব টেক্সট ফিল্ড ও সোশ্যাল মিডিয়া লিংক আপডেট করার জন্য
  const update = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.put(
        `${API}api/admin/settings/general`,
        payload,
        { headers: authHeaders() }
      );
      return res.data;
    },
    onSuccess: () => {
      // ডেটা আপডেট হওয়ার সাথে সাথে ফুটার এবং ড্যাশবোর্ড অটো রি-রেন্ডার হবে
      qc.invalidateQueries({ queryKey: ["general-settings"] });
    },
  });

  // ৩. POST: লোগো ইমেজ ImgBB-তে আপলোড করার জন্য
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(
        `${API}api/admin/settings/general/logo`,
        formData,
        {
          headers: {
            ...authHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-settings"] });
    },
  });

  // ৪. DELETE: লোগো লিংক ডাটাবেজ থেকে মুছে ফেলার জন্য
  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.delete(
        `${API}api/admin/settings/general/logo`,
        { headers: authHeaders() }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["general-settings"] });
    },
  });

  return {
    ...query, // এর ভেতরেই isLoading, error এবং সব data (phone, email, logoUrl ইত্যাদি) আছে
    updateGeneralSettings: update,
    uploadLogo: uploadLogoMutation,
    deleteLogo: deleteLogoMutation,
  };
}