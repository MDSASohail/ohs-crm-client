import api from "../config/axios";

// Create payment record for an enrollment
export const createPayment = (data) =>
  api.post("/payments", data);

// Get payment record by enrollmentId
export const getPayment = (enrollmentId) =>
  api.get(`/payments/${enrollmentId}`);

// Update total fee and/or deadline
export const updatePayment = (enrollmentId, data) =>
  api.put(`/payments/${enrollmentId}`, data);

// ── Transactions ──────────────────────────────────────────────────────────────

export const addTransaction = (enrollmentId, data) =>
  api.post(`/payments/${enrollmentId}/transactions`, data);

export const updateTransaction = (enrollmentId, transactionId, data) =>
  api.put(`/payments/${enrollmentId}/transactions/${transactionId}`, data);

export const deleteTransaction = (enrollmentId, transactionId) =>
  api.delete(`/payments/${enrollmentId}/transactions/${transactionId}`);

// ── Expenses ──────────────────────────────────────────────────────────────────

export const addExpense = (enrollmentId, data) =>
  api.post(`/payments/${enrollmentId}/expenses`, data);

export const updateExpense = (enrollmentId, expenseId, data) =>
  api.put(`/payments/${enrollmentId}/expenses/${expenseId}`, data);

export const deleteExpense = (enrollmentId, expenseId) =>
  api.delete(`/payments/${enrollmentId}/expenses/${expenseId}`);