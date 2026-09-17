export const trackPixel = (eventName, data = {}) => {

  const payload = {
    ...data,
    currency: "BDT",
  };

  console.log("PIXEL EVENT:", eventName, payload);

  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, payload);
  }
};