// Format a number as Indian Rupees — e.g. "₹12,500"
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format a number with commas only — e.g. "12,500"
export const formatNumber = (number) => {
  if (number === null || number === undefined) return "—";
  return new Intl.NumberFormat("en-IN").format(number);
};