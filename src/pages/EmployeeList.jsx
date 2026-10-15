import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import { getEmployees, deleteEmployee } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { DepartmentBadge, StatusBadge } from '../components/Badge.jsx';
import WorkloadBar from '../components/WorkloadBar.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';

const DEPARTMENTS = ['All', 'Development', 'Design', 'QA', 'HR', 'Sales'];
const STATUSES = ['All', 'Active', 'Inactive', 'On Leave'];

export default function EmployeeList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();

  // Read URL query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || 'All';
  const status = searchParams.get('status') || 'All';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Update URL parameters helper
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

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search,
        department,
        status,
        sortBy,
        sortOrder,
      };
      const res = await getEmployees(params);
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
    } catch (err) {
      showError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, limit, search, department, status, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await deleteEmployee(deleteTarget._id);
      showSuccess(res.data.message || 'Employee deleted successfully');
      setDeleteTarget(null);
      fetchEmployees();
    } catch (err) {
      showError(err.message || 'Cannot delete employee');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} style={{ color: 'var(--primary)' }} />
            Employees Directory
          </h1>
          <p className="page-subtitle">
            Manage organizational team members, leave schedules, and capacity allocations
          </p>
        </div>
        <Link to="/employees/new" className="btn btn-primary">
          <Plus size={18} />
          <span>Add Employee</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, employee ID, or email..."
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

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => updateParams({ sortBy: e.target.value, page: 1 })}
            className="filter-select"
            title="Sort by field"
          >
            <option value="createdAt">Sort: Created Date</option>
            <option value="name">Sort: Name</option>
            <option value="employeeId">Sort: Employee ID</option>
            <option value="department">Sort: Department</option>
            <option value="status">Sort: Status</option>
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

      {/* Content Table */}
      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Try adjusting your search criteria or filters, or add a new employee."
          actionLabel="Add New Employee"
          actionLink="/employees/new"
        />
      ) : (
        <>
          <div className="table-responsive desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status / Schedule</th>
                <th style={{ width: '180px' }}>Active Workload</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--neutral-100) 0%, var(--neutral-200) 100%)',
                          color: 'var(--neutral-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          to={`/employees/${emp._id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--neutral-900)',
                            textDecoration: 'none',
                          }}
                        >
                          {emp.name}
                        </Link>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                          {emp.employeeId} • {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <DepartmentBadge department={emp.department} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                      {emp.designation || 'Specialist'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <StatusBadge status={emp.status} isEmployee />
                      {emp.status === 'On Leave' && emp.leaveStartDate && emp.leaveEndDate && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--warning-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(emp.leaveStartDate).toLocaleDateString()} -{' '}
                          {new Date(emp.leaveEndDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <WorkloadBar activeCount={emp.activeTasksCount} max={3} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <Link
                        to={`/employees/${emp._id}`}
                        className="btn btn-secondary btn-sm"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        to={`/employees/${emp._id}/edit`}
                        className="btn btn-secondary btn-sm"
                        title="Edit Employee"
                      >
                        <Edit2 size={15} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(emp)}
                        className="btn btn-danger-outline btn-sm"
                        title="Delete Employee"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {/* Mobile Employee Cards List (Matches Dark App Squircle Styling) */}
          <div className="mobile-task-cards-list mobile-only">
            {employees.map((emp) => (
              <div key={emp._id} className="mobile-entity-card">
                <div className="mobile-entity-card-top">
                  <div className="mobile-entity-left">
                    <div className="mobile-avatar-badge">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/employees/${emp._id}`} className="mobile-entity-title">
                        {emp.name}
                      </Link>
                      <div className="mobile-entity-subtitle">
                        {emp.employeeId} • {emp.designation || 'Specialist'}
                      </div>
                    </div>
                  </div>
                  <div className="mobile-entity-badge-stack">
                    <DepartmentBadge department={emp.department} />
                    <StatusBadge status={emp.status} isEmployee />
                  </div>
                </div>

                <div className="mobile-entity-card-body">
                  <div className="mobile-entity-detail-row">
                    <span className="detail-label">Active Capacity:</span>
                    <span className={`detail-value ${emp.isAtCapacity ? 'at-capacity' : ''}`}>
                      {emp.activeTasksCount} / 3 Tasks {emp.isAtCapacity && '(Full)'}
                    </span>
                  </div>
                  <WorkloadBar activeCount={emp.activeTasksCount} max={3} showLabel={false} />
                </div>

                <div className="mobile-entity-card-actions">
                  <Link
                    to={`/employees/${emp._id}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/employees/${emp._id}/edit`}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.45rem 0.75rem' }}
                    title="Edit Employee"
                  >
                    <Edit2 size={16} />
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(emp)}
                    className="btn btn-danger-outline btn-sm"
                    style={{ padding: '0.45rem 0.75rem' }}
                    title="Delete Employee"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Employee"
        message={
          deleteTarget?.activeTasksCount > 0
            ? `Cannot delete "${deleteTarget?.name}"! They currently hold ${deleteTarget?.activeTasksCount} active task(s) (Todo/In Progress). Per business rules, active tasks must be reassigned or resolved first.`
            : `Are you sure you want to delete employee "${deleteTarget?.name}" (${deleteTarget?.employeeId})? Historical completed tasks will safely retain their record snapshot.`
        }
        confirmText="Confirm Delete"
        isDanger={true}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
