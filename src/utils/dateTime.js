export const toInputFormat = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const bdDate = new Date(
    date.toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
    })
  );

  const year = bdDate.getFullYear();
  const month = String(bdDate.getMonth() + 1).padStart(2, "0");
  const day = String(bdDate.getDate()).padStart(2, "0");

  const hours = String(bdDate.getHours()).padStart(2, "0");
  const minutes = String(bdDate.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatBD = (dateString) => {
  if (!dateString) return "";

  return new Date(dateString).toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
  });
};

// Save করার আগে ব্যবহার করবে
export const bdToISO = (dateString) => {
  if (!dateString) return null;

  return new Date(dateString).toISOString();
};