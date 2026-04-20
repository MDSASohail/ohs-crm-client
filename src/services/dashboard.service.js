import api from "../config/axios";

export const getDashboardSummary = () =>
  api.get("/dashboard/summary");

export const getEnrollmentsByMonth = (year) =>
  api.get("/dashboard/enrollments-by-month", { params: { year } });

export const getPassFailRatio = () =>
  api.get("/dashboard/pass-fail-ratio");

export const getUpcomingDates = () =>
  api.get("/dashboard/upcoming-dates");

export const getPendingChecklist = () =>
  api.get("/dashboard/pending-checklist");

export const getOverduePayments = () =>
  api.get("/dashboard/overdue-payments");