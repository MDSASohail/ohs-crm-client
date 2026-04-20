// Truncate a string to a max length and add ellipsis — e.g. "This is a lon..."
export const truncate = (str, maxLength = 40) => {
  if (!str) return "—";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "...";
};

// Truncate a name to first + last word — e.g. "Nahid Hussain" from "Nahid Ahmed Hussain"
export const truncateName = (fullName) => {
  if (!fullName) return "—";
  const parts = fullName.trim().split(" ");
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
};