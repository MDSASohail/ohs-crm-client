import api from "../config/axios";

// Get all enrollments — supports filtering by course, institute, status, etc.
export const getEnrollments = (params) =>
  api.get("/enrollments", { params });

// Get single enrollment by ID — includes full checklist
export const getEnrollmentById = (id) =>
  api.get(`/enrollments/${id}`);

// Create new enrollment
export const createEnrollment = (data) =>
  api.post("/enrollments", data);

// Update enrollment by ID — status, exam dates, result, certificate, remarks
export const updateEnrollment = (id, data) =>
  api.put(`/enrollments/${id}`, data);

// Soft delete enrollment
export const deleteEnrollment = (id) =>
  api.delete(`/enrollments/${id}`);


// Mark a checklist step as done — with optional date, assignedTo, note
export const markStepDone = (enrollmentId, stepId, data) =>
  api.put(`/enrollments/${enrollmentId}/checklist/${stepId}/done`, data);

// Unmark a completed or skipped step
export const markStepUndone = (enrollmentId, stepId) =>
  api.put(`/enrollments/${enrollmentId}/checklist/${stepId}/undone`);

// Skip a step — requires skipReason
export const skipStep = (enrollmentId, stepId, data) =>
  api.put(`/enrollments/${enrollmentId}/checklist/${stepId}/skip`, data);