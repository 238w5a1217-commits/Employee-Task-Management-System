import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { updateTaskStatus } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { StatusBadge } from './Badge.jsx';

export default function StatusModal({ task, isOpen, onClose, onStatusUpdated }) {
  const { showSuccess, showError } = useNotification();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task) return null;

  // Compute valid next statuses according to strict business rules
  // Todo -> In Progress, Cancelled
  // In Progress -> Completed, Cancelled
  // Completed / Cancelled -> None
  const allowedTransitions = {
    Todo: ['In Progress', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled'],
  };

  const validNextStatuses = allowedTransitions[task.status] || [];
  const isFinalized = task.status === 'Completed' || task.status === 'Cancelled';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      showError('Please choose a valid next status');
      return;
    }

    try {
      setLoading(true);
      const res = await updateTaskStatus(task._id, selectedStatus);
      showSuccess(res.data.message || `Status updated to "${selectedStatus}" successfully`);
      onStatusUpdated(res.data.task);
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Update Task Status</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', marginBottom: '0.25rem' }}>
                Task Title
              </div>
              <div style={{ fontWeight: 700, color: 'var(--neutral-900)', fontSize: '1rem' }}>
                {task.title}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: 'var(--neutral-50)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.2rem' }}>
                  Current Status
                </div>
                <StatusBadge status={task.status} />
              </div>
              <ArrowRight size={18} style={{ color: 'var(--neutral-400)', marginTop: '0.8rem' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '0.2rem' }}>
                  Next Target Status
                </div>
                {selectedStatus ? (
                  <StatusBadge status={selectedStatus} />
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--neutral-400)' }}>Select an allowed transition</span>
                )}
              </div>
            </div>

            {isFinalized ? (
              <div
                style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <AlertCircle size={18} />
                <span>
                  This task is <strong>{task.status}</strong> and cannot be moved to any other status.
                </span>
              </div>
            ) : validNextStatuses.length === 0 ? (
              <div style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>
                No further status transitions are available for this task.
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">
                  Choose New Status <span className="form-label-required">*</span>
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">-- Select Valid Next Status --</option>
                  {validNextStatuses.map((st) => (
                    <option key={st} value={st}>
                      {st} {st === 'Completed' ? '(Sets completed date automatically)' : ''}
                    </option>
                  ))}
                </select>
                <span className="form-hint" style={{ marginTop: '0.35rem' }}>
                  Strict status rules: Todo → In Progress / Cancelled, In Progress → Completed / Cancelled.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            {!isFinalized && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !selectedStatus}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm Update'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
