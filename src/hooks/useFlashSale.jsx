import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function useFlashSale() {
  const BASE = import.meta.env.VITE_APP_SERVER_URL;

  const { data } = useQuery({
    queryKey: ["flash-sale-settings"],
    queryFn: async () => {
      const res = await axios.get(
        `${BASE}api/flashsale/settings`
      );

      return res.data;
    },
  });

  const now = new Date();

  const active =
    data?.status === "active" &&
    now >= new Date(data?.startDate) &&
    now <= new Date(data?.endDate);

  return {
    flashSaleActive: active,
    settings: data,
  };
}