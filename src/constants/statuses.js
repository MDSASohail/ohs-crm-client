// Enrollment status pipeline
export const ENROLLMENT_STATUS = {
  ENQUIRY: "enquiry",
  DOCUMENTS_PENDING: "documents_pending",
  ADMITTED: "admitted",
  LEARNING: "learning",
  EXAM: "exam",
  AWAITING_RESULT: "awaiting_result",
  PASSED: "passed",
  FAILED: "failed",
  COMPLETED: "completed",
};

// Human-readable labels for enrollment statuses
export const ENROLLMENT_STATUS_LABELS = {
  enquiry: "Enquiry",
  documents_pending: "Documents Pending",
  admitted: "Admitted",
  learning: "Learning",
  exam: "Exam",
  awaiting_result: "Awaiting Result",
  passed: "Passed",
  failed: "Failed",
  completed: "Completed",
};

// Color mapping for enrollment status badges
export const ENROLLMENT_STATUS_COLORS = {
  enquiry: "bg-blue-100 text-blue-700",
  documents_pending: "bg-yellow-100 text-yellow-700",
  admitted: "bg-purple-100 text-purple-700",
  learning: "bg-indigo-100 text-indigo-700",
  exam: "bg-orange-100 text-orange-700",
  awaiting_result: "bg-amber-100 text-amber-700",
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-700",
};

// Payment status
export const PAYMENT_STATUS = {
  PARTIAL: "partial",
  COMPLETE: "complete",
  OVERDUE: "overdue",
};

// Human-readable labels for payment statuses
export const PAYMENT_STATUS_LABELS = {
  partial: "Partial",
  complete: "Complete",
  overdue: "Overdue",
};

// Color mapping for payment status badges
export const PAYMENT_STATUS_COLORS = {
  partial: "bg-yellow-100 text-yellow-700",
  complete: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

// Result values for enrollments
export const RESULT = {
  PASS: "pass",
  FAIL: "fail",
  PENDING: "pending",
};

// Certificate sent via options
export const CERTIFICATE_SENT_VIA = {
  COURIER: "courier",
  EMAIL: "email",
  HAND: "hand",
};

// Reminder types
export const REMINDER_TYPES = {
  INTERNAL: "internal",
  EMAIL: "email",
  WHATSAPP: "whatsapp",
};

// Reminder status
export const REMINDER_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  CANCELLED: "cancelled",
};