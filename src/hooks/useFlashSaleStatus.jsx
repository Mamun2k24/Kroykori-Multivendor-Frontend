import { useQuery } from "@tanstack/react-query";

export default function useFlashSaleStatus() {
  const BASE = import.meta.env.VITE_APP_SERVER_URL;

  const { data } = useQuery({
    queryKey: ["flash-sale-settings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/flashsale/settings`);
      return res.json();
    },
  });

  const now = Date.now();

  const campaignActive =
    data?.status === "active" &&
    now >= new Date(data?.startDate).getTime() &&
    now <= new Date(data?.endDate).getTime();

  return {
    campaignActive,
    settings: data,
  };
}