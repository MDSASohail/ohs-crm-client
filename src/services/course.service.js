import api from "../config/axios";

export const getCourses = (params) =>
  api.get("/courses", { params });

export const getCourseById = (id) =>
  api.get(`/courses/${id}`);

export const createCourse = (data) =>
  api.post("/courses", data);

export const updateCourse = (id, data) =>
  api.put(`/courses/${id}`, data);

export const deleteCourse = (id) =>
  api.delete(`/courses/${id}`);

export const deactivateCourse = (id) =>
  api.put(`/courses/${id}/deactivate`);

export const activateCourse = (id) =>
  api.put(`/courses/${id}/activate`);

// ── Checklist template ────────────────────────────────────────────────────────
export const getChecklistTemplate = (courseId) =>
  api.get(`/checklists/${courseId}`);

export const createChecklistTemplate = (courseId, data) =>
  api.post(`/checklists/${courseId}`, data);

export const addChecklistStep = (courseId, data) =>
  api.post(`/checklists/${courseId}/steps`, data);

export const updateChecklistStep = (courseId, stepId, data) =>
  api.put(`/checklists/${courseId}/steps/${stepId}`, data);

export const deleteChecklistStep = (courseId, stepId) =>
  api.delete(`/checklists/${courseId}/steps/${stepId}`);

export const reorderChecklistSteps = (courseId, data) =>
  api.put(`/checklists/${courseId}/reorder`, data);