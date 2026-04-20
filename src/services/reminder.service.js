import api from "../config/axios";

export const getReminders = (params) =>
  api.get("/reminders", { params });

export const getReminderById = (id) =>
  api.get(`/reminders/${id}`);

export const createReminder = (data) =>
  api.post("/reminders", data);

export const sendReminder = (id) =>
  api.post(`/reminders/${id}/send`);

export const cancelReminder = (id) =>
  api.put(`/reminders/${id}/cancel`);

export const deleteReminder = (id) =>
  api.delete(`/reminders/${id}`);