import api from '../config/axios';

export const getTemplate       = (courseId)              => api.get(`/required-doc-templates/${courseId}`);
export const addSlot           = (courseId, data)        => api.post(`/required-doc-templates/${courseId}/slots`, data);
export const editSlot          = (courseId, slotId, data)=> api.put(`/required-doc-templates/${courseId}/slots/${slotId}`, data);
export const deleteSlot        = (courseId, slotId)      => api.delete(`/required-doc-templates/${courseId}/slots/${slotId}`);
export const reorderSlots      = (courseId, orderedIds)  => api.put(`/required-doc-templates/${courseId}/slots/reorder`, { orderedIds });