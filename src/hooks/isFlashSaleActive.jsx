export const isFlashSaleActive = (settings) => {
  if (!settings) return false;

  const now = new Date();

  return (
    settings.status === "active" &&
    now >= new Date(settings.startDate) &&
    now <= new Date(settings.endDate)
  );
};