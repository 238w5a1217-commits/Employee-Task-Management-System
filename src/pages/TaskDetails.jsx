import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { getTaskById, deleteTask, updateTaskStatus } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  DepartmentBadge,
  PriorityBadge,
  StatusBadge,
  OverdueBadge,
} from '../components/Badge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await getTaskById(id);
      setTask(res.data.task);
    } catch (err) {
      showError(err.message || 'Failed to load task details');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStatusTransition = async (nextStatus) => {
    try {
      setStatusUpdating(true);
      const res = await updateTaskStatus(id, nextStatus);
      showSuccess(res.data.message || `Task status updated to "${nextStatus}"`);
      fetchTask();
    } catch (err) {
      showError(err.message || 'Status transition rejected by server');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteTask(id);
      showSuccess(res.data.message || 'Task deleted successfully');
      navigate('/tasks');
    } catch (err) {
      showError(err.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading || !task) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div className="skeleton" style={{ width: '40%', height: '28px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '250px' }} />
      </div>
    );
  }

  const isFinalized = task.status === 'Completed' || task.status === 'Cancelled';

  // Allowed transitions
  const allowedTransitions = {
    Todo: ['In Progress', 'Cancelled'],
    'In Progress': ['Completed', 'Cancelled'],
  };
  const validTransitions = allowedTransitions[task.status] || [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Back button */}
      <Link
        to="/tasks"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--neutral-500)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        <ArrowLeft size={16} /> Back to Tasks
      </Link>

      {/* Overdue Warning Alert */}
      {task.isOverdue && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(90deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b' }}>
            <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>CRITICAL OVERDUE TASK</div>
              <div style={{ fontSize: '0.85rem' }}>
                This task deadline was <strong>{new Date(task.dueDate).toLocaleDateString()}</strong> and remains incomplete.
              </div>
            </div>
          </div>
          <OverdueBadge isOverdue dueDate={task.dueDate} />
        </div>
      )}

      {/* Visual Status Flow Tracker */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
            Lifecycle Pipeline & Transition Flow
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
            Strict Flow: Todo → In Progress → Completed / Cancelled
          </span>
        </div>
        <div className="card-body">
          <div className="status-flow-tracker">
            <div className="flow-line" />

            {/* Todo Node */}
            <div
              className={`flow-step ${
                task.status === 'Todo'
                  ? 'active'
                  : task.status !== 'Cancelled'
                  ? 'completed'
                  : ''
              }`}
            >
              <div className="flow-node">1</div>
              <span className="flow-label">Todo</span>
            </div>

            {/* In Progress Node */}
            <div
              className={`flow-step ${
                task.status === 'In Progress'
                  ? 'active'
                  : task.status === 'Completed'
                  ? 'completed'
                  : ''
              }`}
            >
              <div className="flow-node">2</div>
              <span className="flow-label">In Progress</span>
            </div>

            {/* Final Node */}
            <div
              className={`flow-step ${
                task.status === 'Completed'
                  ? 'completed active'
                  : task.status === 'Cancelled'
                  ? 'cancelled active'
                  : ''
              }`}
            >
              <div className="flow-node">
                {task.status === 'Cancelled' ? '✕' : '3'}
              </div>
              <span className="flow-label">
                {task.status === 'Cancelled' ? 'Cancelled' : 'Completed'}
              </span>
            </div>
          </div>

          {/* Quick Transition Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1rem',
              background: 'var(--neutral-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--neutral-200)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-500)' }}>
                Current Status:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                <StatusBadge status={task.status} />
                {isFinalized && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>
                    (Permanently finalized)
                  </span>
                )}
              </div>
            </div>

            {/* Next Allowed Transitions */}
            {!isFinalized && validTransitions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-600)' }}>
                  Advance to:
                </span>
                {validTransitions.map((nextSt) => (
                  <button
                    key={nextSt}
                    onClick={() => handleStatusTransition(nextSt)}
                    disabled={statusUpdating}
                    className={`btn btn-sm ${
                      nextSt === 'Completed'
                        ? 'btn-primary'
                        : nextSt === 'Cancelled'
                        ? 'btn-danger-outline'
                        : 'btn-secondary'
                    }`}
                  >
                    <span>{nextSt === 'In Progress' ? 'Start Progress' : nextSt}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Task Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Scope & Details</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <PriorityBadge priority={task.priority} />
              <DepartmentBadge department={task.department} />
            </div>
          </div>
          <div className="card-body">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--neutral-900)', marginBottom: '0.85rem' }}>
              {task.title}
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--neutral-600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {task.description || 'No detailed description provided for this task.'}
            </div>
          </div>
        </div>

        {/* Assignee Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <User size={18} style={{ color: 'var(--primary)' }} />
              Assigned Employee
            </h3>
            {task.assignedEmployee?._id && (
              <Link to={`/employees/${task.assignedEmployee._id}`} className="btn btn-outline btn-sm">
                View Profile
              </Link>
            )}
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                }}
              >
                {task.assignedEmployee?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
                  {task.assignedEmployee?.name || 'Unassigned / Former Employee'}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
                  {task.assignedEmployee?.employeeId} • {task.assignedEmployee?.email || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', borderTop: '1px solid var(--neutral-200)', paddingTop: '0.75rem' }}>
              <strong>Snapshot Guarantee:</strong> If this employee is ever deleted in the future, this task permanently preserves their full historical identity.
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Dates Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            Timeline & Dates Telemetry
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
            Completed Date timestamped by backend upon completion
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {/* Start Date */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Start Date
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neutral-800)', marginTop: '0.25rem' }}>
                {new Date(task.startDate).toLocaleDateString()}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Due Date
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: task.isOverdue ? 'var(--danger)' : 'var(--neutral-800)', marginTop: '0.25rem' }}>
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>

            {/* Completed Date */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Completed Date (Backend Timestamp)
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: task.completedDate ? 'var(--success-text)' : 'var(--neutral-400)', marginTop: '0.25rem' }}>
                {task.completedDate ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    {new Date(task.completedDate).toLocaleString()}
                  </span>
                ) : (
                  'Pending Completion'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {isFinalized && (
            <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
              Completed and Cancelled tasks are locked from edits.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!isFinalized && (
            <Link to={`/tasks/${task._id}/edit`} className="btn btn-secondary">
              <Edit2 size={16} />
              <span>Edit Task</span>
            </Link>
          )}
          <button onClick={() => setDeleteConfirmOpen(true)} className="btn btn-danger-outline">
            <Trash2 size={16} />
            <span>Delete Task</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Task"
        message={`Are you sure you want to permanently delete task "${task.title}"?`}
        confirmText="Confirm Delete"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
