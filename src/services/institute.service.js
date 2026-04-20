import api from "../config/axios";

// ── Core institute ────────────────────────────────────────────────────────────
export const getInstitutes = (params) =>
  api.get("/institutes", { params });

export const getInstituteById = (id) =>
  api.get(`/institutes/${id}`);

export const createInstitute = (data) =>
  api.post("/institutes", data);

export const updateInstitute = (id, data) =>
  api.put(`/institutes/${id}`, data);

export const deleteInstitute = (id) =>
  api.delete(`/institutes/${id}`);

export const deactivateInstitute = (id) =>
  api.put(`/institutes/${id}/deactivate`);

export const activateInstitute = (id) =>
  api.put(`/institutes/${id}/activate`);

// ── Contacts ──────────────────────────────────────────────────────────────────
export const addContact = (id, data) =>
  api.post(`/institutes/${id}/contacts`, data);

export const updateContact = (id, contactId, data) =>
  api.put(`/institutes/${id}/contacts/${contactId}`, data);

export const deleteContact = (id, contactId) =>
  api.delete(`/institutes/${id}/contacts/${contactId}`);

// ── Courses offered ───────────────────────────────────────────────────────────
export const addCourseOffered = (id, data) =>
  api.post(`/institutes/${id}/courses`, data);

export const updateCourseOffered = (id, courseOfferedId, data) =>
  api.put(`/institutes/${id}/courses/${courseOfferedId}`, data);

export const deleteCourseOffered = (id, courseOfferedId) =>
  api.delete(`/institutes/${id}/courses/${courseOfferedId}`);