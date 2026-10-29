import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService } from '../services/ticketService.js';
import { TicketWorkspace } from '../components/workspace/TicketWorkspace.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';

export function TicketWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchTicket = () => {
    setLoading(true);
    ticketService.getTicketById(id)
      .then((res) => setTicket(res.data))
      .catch((err) => {
        showToast(`Failed to load ticket: ${err.message}`, 'error');
        navigate('/inbox');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleGenerateDraft = async () => {
    setLoadingAction(true);
    try {
      const res = await ticketService.generateDraft(id, 'Sonia K. (Senior Specialist)');
      setTicket(res.data.ticket);
      showToast('AI Resolution Draft generated successfully with grounded evidence.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditDraft = async (editableReply) => {
    setLoadingAction(true);
    try {
      await ticketService.editDraft(id, editableReply, 'Sonia K. (Senior Specialist)');
      const res = await ticketService.getTicketById(id);
      setTicket(res.data);
      showToast('Draft edits saved and recorded in audit trail.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApproveDraft = async (agentName) => {
    setLoadingAction(true);
    try {
      await ticketService.approveDraft(id, agentName);
      const res = await ticketService.getTicketById(id);
      setTicket(res.data);
      showToast('Draft approved! Status: Ready to send (Human Approved).', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectDraft = async (reason, agentName) => {
    setLoadingAction(true);
    try {
      await ticketService.rejectDraft(id, reason, agentName);
      const res = await ticketService.getTicketById(id);
      setTicket(res.data);
      showToast('Draft rejected. Rejection reason logged in audit trail.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResolveTicket = async (agentName, notes) => {
    setLoadingAction(true);
    try {
      await ticketService.resolveTicket(id, agentName, notes);
      const res = await ticketService.getTicketById(id);
      setTicket(res.data);
      showToast('Ticket marked as RESOLVED.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[75vh]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <TicketWorkspace
      ticket={ticket}
      loadingAction={loadingAction}
      onGenerateDraft={handleGenerateDraft}
      onEditDraft={handleEditDraft}
      onApproveDraft={handleApproveDraft}
      onRejectDraft={handleRejectDraft}
      onResolveTicket={handleResolveTicket}
    />
  );
}
