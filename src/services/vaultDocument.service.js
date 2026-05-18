import api from '../config/axios';

// Fetch all vault documents — supports search, tags, page, limit
export const getVaultDocuments = (params) =>
  api.get('/vault-documents', { params });

// Upload a new document — multipart/form-data
export const uploadVaultDocument = (formData) =>
  api.post('/vault-documents/upload', formData);
// Do NOT set Content-Type header — browser sets it automatically with boundary

// Rename a document
export const renameVaultDocument = (id, name) =>
  api.put(`/vault-documents/${id}/rename`, { name });

// Update tags on a document
export const updateVaultDocumentTags = (id, tags) =>
  api.put(`/vault-documents/${id}/tags`, { tags });

// Update note on a document
export const updateVaultDocumentNote = (id, note) =>
  api.put(`/vault-documents/${id}/note`, { note });

// Soft delete a document
export const deleteVaultDocument = (id) =>
  api.delete(`/vault-documents/${id}`);