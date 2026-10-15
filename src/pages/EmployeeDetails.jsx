import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { getEmployeeById, deleteEmployee } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { DepartmentBadge, StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badge.jsx';
import WorkloadBar from '../components/WorkloadBar.jsx';
import StatusModal from '../components/StatusModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  const [modalTask, setModalTask] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getEmployeeById(id);
      setData(res.data);
    } catch (err) {
      showError(err.message || 'Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteEmployee(id);
      showSuccess(res.data.message || 'Employee deleted successfully');
      navigate('/employees');
    } catch (err) {
      showError(err.message || 'Failed to delete employee');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div className="skeleton" style={{ width: '30%', height: '28px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '200px' }} />
      </div>
    );
  }

  const employee = data?.employee || {};
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const stats = data?.stats || {};
  const activeTasks = tasks.filter((t) => t.status === 'Todo' || t.status === 'In Progress');
  const historyTasks = tasks.filter((t) => t.status === 'Completed' || t.status === 'Cancelled');

  return (
    <div>
      {/* Back button */}
      <Link
        to="/employees"
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
        <ArrowLeft size={16} /> Back to Employees
      </Link>

      {/* Profile Card Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          className="card-body"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.85rem',
                fontWeight: 800,
                boxShadow: '0 8px 16px var(--primary-glow)',
              }}
            >
              {employee.name.charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--neutral-900)' }}>
                  {employee.name}
                </h1>
                <span className="brand-badge">{employee.employeeId}</span>
                <StatusBadge status={employee.status} isEmployee />
                <DepartmentBadge department={employee.department} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Briefcase size={15} /> {employee.designation || 'Specialist'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={15} /> {employee.email}
                </span>
                {employee.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={15} /> {employee.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to={`/tasks/new?employeeId=${employee._id}`}
              className="btn btn-primary btn-sm"
              style={{
                pointerEvents: employee.isAtCapacity || employee.status === 'Inactive' ? 'none' : 'auto',
                opacity: employee.isAtCapacity || employee.status === 'Inactive' ? 0.5 : 1,
              }}
            >
              <Plus size={16} />
              <span>Assign Task</span>
            </Link>
            <Link to={`/employees/${employee._id}/edit`} className="btn btn-secondary btn-sm">
              <Edit2 size={15} />
              <span>Edit</span>
            </Link>
            <button onClick={() => setDeleteConfirmOpen(true)} className="btn btn-danger-outline btn-sm">
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* On Leave Banner */}
        {employee.status === 'On Leave' && employee.leaveStartDate && employee.leaveEndDate && (
          <div
            style={{
              padding: '0.85rem 1.5rem',
              background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
              borderTop: '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--warning-text)',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Calendar size={18} />
            <span>
              Currently On Leave from{' '}
              <strong>{new Date(employee.leaveStartDate).toLocaleDateString()}</strong> to{' '}
              <strong>{new Date(employee.leaveEndDate).toLocaleDateString()}</strong>.
              Tasks starting within this window cannot be assigned.
            </span>
          </div>
        )}
      </div>

      {/* Metrics & Workload Section */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Capacity Card */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
              Current Capacity
            </span>
            <span
              className={`capacity-chip ${employee.isAtCapacity ? 'full' : 'available'}`}
              style={{ fontSize: '0.8rem' }}
            >
              {employee.isAtCapacity ? 'Full (3/3)' : `${employee.capacityRemaining} Available`}
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
            {employee.activeTasksCount} / 3 <span style={{ fontSize: '0.9rem', color: 'var(--neutral-500)', fontWeight: 500 }}>Active Tasks</span>
          </div>
          <WorkloadBar activeCount={employee.activeTasksCount} max={3} showLabel={false} />
        </div>

        {/* Total Tasks */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
            Total Assigned
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--neutral-900)', margin: '0.5rem 0' }}>
            {stats?.totalTasks || 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
            All-time tasks assigned to this employee
          </span>
        </div>

        {/* Completed Tasks */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
            Completed Tasks
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-text)', margin: '0.5rem 0' }}>
            {stats?.completedCount || 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>
            Successfully finalized tasks
          </span>
        </div>

        {/* Overdue Tasks */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
            Overdue Warning
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stats?.overdueCount > 0 ? 'var(--danger)' : 'var(--neutral-900)', margin: '0.5rem 0' }}>
            {stats?.overdueCount || 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: stats?.overdueCount > 0 ? 'var(--danger)' : 'var(--neutral-500)' }}>
            {stats?.overdueCount > 0 ? 'Requires immediate attention' : 'No overdue tasks'}
          </span>
        </div>
      </div>

      {/* Tasks Tab Section */}
      <div className="card">
        <div className="card-header" style={{ padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'active' ? '3px solid var(--primary)' : '3px solid transparent',
                padding: '1rem 0.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: activeTab === 'active' ? 'var(--primary)' : 'var(--neutral-500)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Clock size={16} />
              <span>Active Tasks ({activeTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'history' ? '3px solid var(--primary)' : '3px solid transparent',
                padding: '1rem 0.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: activeTab === 'history' ? 'var(--primary)' : 'var(--neutral-500)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Task History ({historyTasks.length})</span>
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {activeTab === 'active' ? (
            activeTasks.length === 0 ? (
              <EmptyState
                title="No active tasks"
                description="This employee currently has no pending or in-progress tasks."
                actionLabel={employee.status === 'Inactive' ? null : 'Assign New Task'}
                actionLink={`/tasks/new?employeeId=${employee._id}`}
              />
            ) : (
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTasks.map((task) => (
                      <tr key={task._id} className={task.isOverdue ? 'table-row-overdue' : ''}>
                        <td>
                          <Link
                            to={`/tasks/${task._id}`}
                            style={{ fontWeight: 700, color: 'var(--neutral-900)', textDecoration: 'none' }}
                          >
                            {task.title}
                          </Link>
                          {task.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td>
                          <StatusBadge status={task.status} />
                        </td>
                        <td>{new Date(task.startDate).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            {task.isOverdue && <OverdueBadge isOverdue dueDate={task.dueDate} />}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setModalTask(task)}
                            className="btn btn-outline btn-sm"
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : historyTasks.length === 0 ? (
            <EmptyState
              title="No historical tasks"
              description="Completed and cancelled tasks will appear in this archive."
            />
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>Due Date</th>
                    <th>Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <Link
                          to={`/tasks/${task._id}`}
                          style={{ fontWeight: 700, color: 'var(--neutral-900)', textDecoration: 'none' }}
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td>
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                      <td>{new Date(task.startDate).toLocaleDateString()}</td>
                      <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td>
                        {task.completedDate ? (
                          <span style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                            {new Date(task.completedDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--neutral-400)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      {modalTask && (
        <StatusModal
          task={modalTask}
          isOpen={!!modalTask}
          onClose={() => setModalTask(null)}
          onStatusUpdated={() => {
            fetchDetails();
            setModalTask(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Employee Profile"
        message={
          activeTasks.length > 0
            ? `Cannot delete "${employee.name}". They currently have ${activeTasks.length} active tasks (Todo / In Progress). Please reassign or complete these tasks first.`
            : `Are you sure you want to delete "${employee.name}" (${employee.employeeId})? Historical completed tasks will safely retain their record snapshot.`
        }
        confirmText="Confirm Delete"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
