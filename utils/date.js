// today's date as YYYY-MM-DD in Dhaka time
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });