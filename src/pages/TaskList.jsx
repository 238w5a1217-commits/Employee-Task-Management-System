import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { getTasks, deleteTask, exportTasksUrl } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  DepartmentBadge,
  PriorityBadge,
  StatusBadge,
  OverdueBadge,
} from '../components/Badge.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusModal from '../components/StatusModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

const DEPARTMENTS = ['All', 'Development', 'Design', 'QA', 'HR', 'Sales'];
const PRIORITIES = ['All', 'Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['All', 'Todo', 'In Progress', 'Completed', 'Cancelled'];

export default function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();

  // Read URL query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || 'All';
  const priority = searchParams.get('priority') || 'All';
  const status = searchParams.get('status') || 'All';
  const isOverdue = searchParams.get('isOverdue') || 'All';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [statusModalTask, setStatusModalTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync state to URL params
  const updateParams = useCallback((newParams) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([k, v]) => {
        if (v === '' || v === 'All' || v === null || v === undefined) {
          updated.delete(k);
        } else {
          updated.set(k, String(v));
        }
      });
      return updated;
    });
  }, [setSearchParams]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        department,
        priority,
        status,
        isOverdue: isOverdue === 'true' ? 'true' : isOverdue === 'false' ? 'false' : undefined,
        sortBy,
        sortOrder,
      };
      const res = await getTasks(params);
      setTasks(Array.isArray(res.data?.tasks) ? res.data.tasks : []);
      setPagination(res.data?.pagination || { total: 0, totalPages: 1, page: 1, limit: 10 });
    } catch (err) {
      setTasks([]);
      showError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, limit, search, department, priority, status, isOverdue, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await deleteTask(deleteTarget._id);
      showSuccess(res.data.message || 'Task deleted successfully');
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      showError(err.message || 'Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV respecting all current active filters
  const handleExportCSV = () => {
    const params = {
      search,
      department,
      priority,
      status,
      isOverdue: isOverdue === 'true' ? 'true' : isOverdue === 'false' ? 'false' : undefined,
      sortBy,
      sortOrder,
    };
    const downloadUrl = exportTasksUrl(params);
    window.location.href = downloadUrl;
    showSuccess('Exporting all tasks matching current filters to CSV...');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CheckSquare size={28} style={{ color: 'var(--primary)' }} />
            Task Management
          </h1>
          <p className="page-subtitle">
            Track lifecycle transitions, assignees, deadlines, and overdue milestones
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" title="Export all matching tasks to CSV">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <Link to="/tasks/new" className="btn btn-primary">
            <Plus size={18} />
            <span>Create Task</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by task title or assigned employee name..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => updateParams({ department: e.target.value, page: 1 })}
            className="filter-select"
            title="Filter by department"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                Dept: {d}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => updateParams({ priority: e.target.value, page: 1 })}
            className="filter-select"
            title="Filter by priority"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="filter-select"
            title="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>

          {/* Overdue Filter */}
          <select
            value={isOverdue}
            onChange={(e) => updateParams({ isOverdue: e.target.value, page: 1 })}
            className="filter-select"
            title="Filter by deadline compliance"
          >
            <option value="All">Deadlines: All</option>
            <option value="true">⚠️ Overdue Only</option>
            <option value="false">✅ On Track</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => updateParams({ sortBy: e.target.value, page: 1 })}
            className="filter-select"
            title="Sort by criteria"
          >
            <option value="createdAt">Sort: Date</option>
            <option value="dueDate">Sort: Due</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Title</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="btn btn-secondary btn-sm"
            title={`Toggle Sort Direction (${sortOrder.toUpperCase()})`}
          >
            <ArrowUpDown size={15} />
            <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
          </button>
        </div>
      </div>

      {/* Task Table */}
      {loading ? (
        <TableSkeleton rows={7} cols={7} />
      ) : (tasks || []).length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Try clearing your search query or filters to view available tasks."
          actionLabel="Create New Task"
          actionLink="/tasks/new"
        />
      ) : (
        <>
          <div className="table-responsive desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Employee</th>
                <th>Timeline & Deadlines</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const isFinalized = task.status === 'Completed' || task.status === 'Cancelled';
                return (
                  <tr key={task._id} className={task.isOverdue ? 'table-row-overdue' : ''}>
                    <td>
                      <Link
                        to={`/tasks/${task._id}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--neutral-900)',
                          textDecoration: 'none',
                          fontSize: '0.925rem',
                          display: 'block',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {task.title}
                      </Link>
                      {task.description && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--neutral-500)',
                            maxWidth: '280px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <DepartmentBadge department={task.department} />
                    </td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>
                      {task.assignedEmployee ? (
                        <Link
                          to={task.assignedEmployee._id ? `/employees/${task.assignedEmployee._id}` : '#'}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--neutral-800)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}
                        >
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {task.assignedEmployee.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              {task.assignedEmployee.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--neutral-400)' }}>
                              {task.assignedEmployee.employeeId || 'Assigned'}
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--neutral-400)', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem' }}>
                          <span style={{ color: 'var(--neutral-500)' }}>Due:</span>
                          <strong style={{ color: task.isOverdue ? 'var(--danger)' : 'var(--neutral-800)' }}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </strong>
                          {task.isOverdue && <OverdueBadge isOverdue dueDate={task.dueDate} />}
                        </div>
                        {task.completedDate && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Completed {new Date(task.completedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        {/* Quick Status Update Modal Button */}
                        <button
                          onClick={() => setStatusModalTask(task)}
                          disabled={isFinalized}
                          className="btn btn-outline btn-sm"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.35rem 0.65rem',
                            opacity: isFinalized ? 0.4 : 1,
                          }}
                          title={isFinalized ? `Task is ${task.status} and cannot be altered` : 'Update Status'}
                        >
                          Status
                        </button>

                        {/* View Button */}
                        <Link
                          to={`/tasks/${task._id}`}
                          className="btn btn-secondary btn-sm"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </Link>

                        {/* Edit Button - Disabled if Completed or Cancelled */}
                        {isFinalized ? (
                          <button
                            disabled
                            className="btn btn-secondary btn-sm"
                            style={{ opacity: 0.35, cursor: 'not-allowed' }}
                            title="Completed and Cancelled tasks cannot be edited"
                          >
                            <Edit2 size={15} />
                          </button>
                        ) : (
                          <Link
                            to={`/tasks/${task._id}/edit`}
                            className="btn btn-secondary btn-sm"
                            title="Edit Task"
                          >
                            <Edit2 size={15} />
                          </Link>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteTarget(task)}
                          className="btn btn-danger-outline btn-sm"
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

          {/* Mobile Card List (Matches Dark App Squircle Styling) */}
          <div className="mobile-task-cards-list mobile-only">
            {tasks.map((task) => {
              const isFinalized = task.status === 'Completed' || task.status === 'Cancelled';
              return (
                <div key={task._id} className="mobile-entity-card">
                  <div className="mobile-entity-card-top">
                    <div className="mobile-entity-left">
                      <div className={`mobile-task-icon-box ${task.isOverdue ? 'overdue' : 'active'}`}>
                        {task.isOverdue ? <AlertTriangle size={18} /> : <CheckSquare size={18} />}
                      </div>
                      <div>
                        <Link to={`/tasks/${task._id}`} className="mobile-entity-title">
                          {task.title}
                        </Link>
                        <div className="mobile-entity-subtitle">
                          Task № {task._id?.slice(-6) || 'TASK'} • {task.department}
                        </div>
                      </div>
                    </div>
                    <div className="mobile-entity-badge-stack">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <div className="mobile-entity-card-body">
                    <div className="mobile-entity-detail-row">
                      <span className="detail-label">Assignee:</span>
                      <span className="detail-value">
                        {task.assignedEmployee?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div className="mobile-entity-detail-row">
                      <span className="detail-label">Due Date:</span>
                      <span className={`detail-value ${task.isOverdue ? 'overdue-text' : ''}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                        {task.isOverdue && ' (Overdue)'}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-entity-card-actions">
                    <button
                      onClick={() => setStatusModalTask(task)}
                      disabled={isFinalized}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, opacity: isFinalized ? 0.4 : 1 }}
                    >
                      Status
                    </button>
                    <Link
                      to={`/tasks/${task._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.45rem 0.75rem' }}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </Link>
                    {!isFinalized && (
                      <Link
                        to={`/tasks/${task._id}/edit`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.45rem 0.75rem' }}
                        title="Edit Task"
                      >
                        <Edit2 size={16} />
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="btn btn-danger-outline btn-sm"
                      style={{ padding: '0.45rem 0.75rem' }}
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => updateParams({ page: p })}
        onLimitChange={(l) => updateParams({ limit: l, page: 1 })}
      />

      {/* Status Modal */}
      {statusModalTask && (
        <StatusModal
          task={statusModalTask}
          isOpen={!!statusModalTask}
          onClose={() => setStatusModalTask(null)}
          onStatusUpdated={() => {
            fetchTasks();
            setStatusModalTask(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Task"
        message={`Are you sure you want to permanently delete task "${deleteTarget?.title}"? This action cannot be reversed.`}
        confirmText="Confirm Delete"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
