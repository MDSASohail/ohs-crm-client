import api from "../config/axios";

// Get all documents for a candidate
export const getDocuments = (candidateId) =>
  api.get(`/documents/${candidateId}`);

// Upload a document — expects FormData with file + name
export const uploadDocument = (candidateId, formData) =>
  api.post(`/documents/${candidateId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Rename a document
export const updateDocument = (candidateId, docId, data) =>
  api.put(`/documents/${candidateId}/${docId}`, data);

// Soft delete a document
export const deleteDocument = (candidateId, docId) =>
  api.delete(`/documents/${candidateId}/${docId}`);

// Permanent delete — root only
export const permanentDeleteDocument = (candidateId, docId) =>
  api.delete(`/documents/${candidateId}/${docId}/permanent`);