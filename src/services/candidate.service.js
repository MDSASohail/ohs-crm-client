import api from "../config/axios";

// Get all candidates — supports search and pagination query params
export const getCandidates = (params) =>
  api.get("/candidates", { params });

// Get single candidate by ID
export const getCandidateById = (id) =>
  api.get(`/candidates/${id}`);

// Create new candidate
export const createCandidate = (data) =>
  api.post("/candidates", data);

// Update candidate by ID
export const updateCandidate = (id, data) =>
  api.put(`/candidates/${id}`, data);

// Soft delete candidate by ID
export const deleteCandidate = (id) =>
  api.delete(`/candidates/${id}`);