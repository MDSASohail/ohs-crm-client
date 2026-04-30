import api from '../config/axios';

export const getCandidateRequiredDocs = (candidateId) =>
  api.get(`/candidate-required-docs/${candidateId}`);

export const uploadFileToSlot = (candidateId, docId, file, name) => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  // Do NOT set Content-Type — browser sets it automatically with boundary
  return api.post(`/candidate-required-docs/${candidateId}/${docId}/upload`, formData);
};

export const renameFile = (candidateId, docId, fileId, name) =>
  api.put(`/candidate-required-docs/${candidateId}/${docId}/files/${fileId}`, { name });

export const deleteFile = (candidateId, docId, fileId) =>
  api.delete(`/candidate-required-docs/${candidateId}/${docId}/files/${fileId}`);