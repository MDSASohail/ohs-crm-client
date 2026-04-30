// ===============================
// 🎓 COURSE TYPES
// ===============================
export const COURSE_TYPES = {
  IGC: "IGC",
  IOSH: "IOSH",
  OSHA: "OSHA",
};

// ===============================
// 🟦 IGC PIPELINE
// ===============================
export const ENROLLMENT_STATUS_IGC = {
  ENQUIRY: "enquiry",
  DOCUMENTS_COLLECTED: "documents_collected",
  DOCUMENT_VERIFIED: "document_verified",
  ADMISSION: "admission",
  LMS: "lms_completed",
  HALL_TICKET: "hall_ticket_received",
  CREDENTIALS: "credentials_received",
  IG_1: "ig1_submitted",
  IG_2: "ig2_submitted",
  INTERVIEW: "interview_completed",
  RESULT: "result",
  CERTIFICATE_SENT: "certificate_sent",
  CERTIFICATE_RECEIVED: "certificate_received",
};

export const ENROLLMENT_STATUS_LABELS_IGC = {
  enquiry: "Enquiry",
  documents_collected: "Documents Collected",
  document_verified: "Document Verified",
  admission: "Admission Confirmed",
  lms_completed: "LMS Completed",
  hall_ticket_received: "Hall Ticket Received",
  credentials_received: "Credentials Received",
  ig1_submitted: "IG1 Submitted",
  ig2_submitted: "IG2 Submitted",
  interview_completed: "Interview Completed",
  result: "Result",
  certificate_sent: "Certificate Sent",
  certificate_received: "Certificate Received",
};

export const ENROLLMENT_STATUS_COLORS_IGC = {
  enquiry: "bg-blue-100 text-blue-700",
  documents_collected: "bg-yellow-100 text-yellow-700",
  document_verified: "bg-amber-100 text-amber-700",
  admission: "bg-purple-100 text-purple-700",
  lms_completed: "bg-indigo-100 text-indigo-700",
  hall_ticket_received: "bg-orange-100 text-orange-700",
  credentials_received: "bg-cyan-100 text-cyan-700",
  ig1_submitted: "bg-teal-100 text-teal-700",
  ig2_submitted: "bg-teal-200 text-teal-800",
  interview_completed: "bg-pink-100 text-pink-700",
  result: "bg-gray-100 text-gray-700",
  certificate_sent: "bg-green-100 text-green-700",
  certificate_received: "bg-green-200 text-green-800",
};

// ===============================
// 🟩 IOSH / OSHA PIPELINE
// ===============================
export const ENROLLMENT_STATUS_IOSHOSHA = {
  ENQUIRY: "enquiry",
  DOCUMENTS_COLLECTED: "documents_collected",
  DOCUMENT_VERIFIED: "document_verified",
  ADMISSION: "admission",
  CREDENTIALS: "credentials_received",
  RESULT: "result",
  CERTIFICATE_SENT: "certificate_sent",
  CERTIFICATE_RECEIVED: "certificate_received",
};

export const ENROLLMENT_STATUS_LABELS_IOSHOSHA = {
  enquiry: "Enquiry",
  documents_collected: "Documents Collected",
  document_verified: "Document Verified",
  admission: "Admission Confirmed",
  credentials_received: "Credentials Received",
  result: "Result",
  certificate_sent: "Certificate Sent",
  certificate_received: "Certificate Received",
};

export const ENROLLMENT_STATUS_COLORS_IOSHOSHA = {
  enquiry: "bg-blue-100 text-blue-700",
  documents_collected: "bg-yellow-100 text-yellow-700",
  document_verified: "bg-amber-100 text-amber-700",
  admission: "bg-purple-100 text-purple-700",
  credentials_received: "bg-cyan-100 text-cyan-700",
  result: "bg-gray-100 text-gray-700",
  certificate_sent: "bg-green-100 text-green-700",
  certificate_received: "bg-green-200 text-green-800",
};

// ===============================
// 🧠 MASTER CONFIG (IMPORTANT)
// ===============================
export const COURSE_STATUS_CONFIG = {
  [COURSE_TYPES.IGC]: {
    statuses: ENROLLMENT_STATUS_IGC,
    labels: ENROLLMENT_STATUS_LABELS_IGC,
    colors: ENROLLMENT_STATUS_COLORS_IGC,
  },
  [COURSE_TYPES.IOSH]: {
    statuses: ENROLLMENT_STATUS_IOSHOSHA,
    labels: ENROLLMENT_STATUS_LABELS_IOSHOSHA,
    colors: ENROLLMENT_STATUS_COLORS_IOSHOSHA,
  },
  [COURSE_TYPES.OSHA]: {
    statuses: ENROLLMENT_STATUS_IOSHOSHA,
    labels: ENROLLMENT_STATUS_LABELS_IOSHOSHA,
    colors: ENROLLMENT_STATUS_COLORS_IOSHOSHA,
  },
};

// ===============================
// ⚡ HELPERS (USE THESE)
// ===============================

// Get full config
export const getCourseConfig = (course) => {
  return COURSE_STATUS_CONFIG[course] || null;
};

// Get statuses only
export const getStatusesByCourse = (course) => {
  return COURSE_STATUS_CONFIG[course]?.statuses || {};
};

// Get label
export const getStatusLabel = (course, status) => {
  return COURSE_STATUS_CONFIG[course]?.labels?.[status] || status;
};

// Get color
export const getStatusColor = (course, status) => {
  return (
    COURSE_STATUS_CONFIG[course]?.colors?.[status] ||
    "bg-gray-100 text-gray-700"
  );
};

// Convert to array (for UI mapping)
export const getStatusSteps = (course) => {
  const config = COURSE_STATUS_CONFIG[course];
  if (!config) return [];

  return Object.values(config.statuses).map((status) => ({
    value: status,
    label: config.labels[status],
    color: config.colors[status],
  }));
};

// ===============================
// 💰 PAYMENT STATUS
// ===============================
export const PAYMENT_STATUS = {
  PARTIAL: "partial",
  COMPLETE: "complete",
  OVERDUE: "overdue",
};

export const PAYMENT_STATUS_LABELS = {
  partial: "Partial",
  complete: "Complete",
  overdue: "Overdue",
};

export const PAYMENT_STATUS_COLORS = {
  partial: "bg-yellow-100 text-yellow-700",
  complete: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

// ===============================
// 📊 RESULT
// ===============================
export const RESULT = {
  PASS: "pass",
  FAIL: "fail",
  PENDING: "pending",
};

// ===============================
// 📦 CERTIFICATE DELIVERY
// ===============================
export const CERTIFICATE_SENT_VIA = {
  COURIER: "courier",
  EMAIL: "email",
  HAND: "hand",
};

// ===============================
// 🔔 REMINDERS
// ===============================
export const REMINDER_TYPES = {
  INTERNAL: "internal",
  EMAIL: "email",
  WHATSAPP: "whatsapp",
};

export const REMINDER_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  CANCELLED: "cancelled",
};


// Need to remove
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
export const ENROLLMENT_STATUS_LABELS = { enquiry: "Enquiry", documents_pending: "Documents Pending", admitted: "Admitted", learning: "Learning", exam: "Exam", awaiting_result: "Awaiting Result", passed: "Passed", failed: "Failed", completed: "Completed", };

// Color mapping for enrollment status badges 
export const ENROLLMENT_STATUS_COLORS = { enquiry: "bg-blue-100 text-blue-700", documents_pending: "bg-yellow-100 text-yellow-700", admitted: "bg-purple-100 text-purple-700", learning: "bg-indigo-100 text-indigo-700", exam: "bg-orange-100 text-orange-700", awaiting_result: "bg-amber-100 text-amber-700", passed: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700", completed: "bg-gray-100 text-gray-700", };