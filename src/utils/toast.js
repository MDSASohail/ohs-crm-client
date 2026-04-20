import toast from "react-hot-toast";

// ── Success ───────────────────────────────────────────────────────────────────
export const toastSuccess = (message) => toast.success(message);

// ── Error ─────────────────────────────────────────────────────────────────────
export const toastError = (message) =>
  toast.error(message || "Something went wrong. Please try again.");

// ── Loading — returns toast id so you can dismiss it ─────────────────────────
export const toastLoading = (message = "Please wait...") =>
  toast.loading(message);

// ── Dismiss a specific toast by id ───────────────────────────────────────────
export const toastDismiss = (id) => toast.dismiss(id);

// ── Promise toast — shows loading, then success or error automatically ────────
// Usage: toastPromise(apiCall(), { loading: "Saving...", success: "Saved!", error: "Failed" })
export const toastPromise = (promise, messages) =>
  toast.promise(promise, {
    loading: messages.loading || "Please wait...",
    success: messages.success || "Done!",
    error: (err) =>
      err?.response?.data?.message ||
      messages.error ||
      "Something went wrong.",
  });