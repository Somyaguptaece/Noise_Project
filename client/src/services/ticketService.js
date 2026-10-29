import api from './api';

export const ticketService = {
  listTickets: (params = {}) => api.get('/tickets', { params }),
  getTicketById: (id) => api.get(`/tickets/${id}`),
  generateDraft: (id, agentName = 'Senior Support Specialist') =>
    api.post(`/tickets/${id}/generate-draft`, { agentName }),
  getEvidence: (id) => api.get(`/tickets/${id}/evidence`),
  editDraft: (id, editableReply, agentName = 'Senior Support Specialist') =>
    api.patch(`/tickets/${id}/draft`, { editableReply, agentName }),
  approveDraft: (id, agentName = 'Senior Support Specialist') =>
    api.post(`/tickets/${id}/approve`, { agentName }),
  rejectDraft: (id, reason, agentName = 'Senior Support Specialist') =>
    api.post(`/tickets/${id}/reject`, { reason, agentName }),
  resolveTicket: (id, agentName = 'Senior Support Specialist', notes = '') =>
    api.post(`/tickets/${id}/resolve`, { agentName, notes })
};
