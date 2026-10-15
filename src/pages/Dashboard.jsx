import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Briefcase,
  AlertCircle,
  Calendar,
  Layers,
  Plus,
  Star,
  FileText,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { getDashboardStats } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import { DepartmentBadge, PriorityBadge, StatusBadge, OverdueBadge } from '../components/Badge.jsx';
import WorkloadBar from '../components/WorkloadBar.jsx';
import StatusModal from '../components/StatusModal.jsx';

export default function Dashboard() {
  const { showError } = useNotification();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModalTask, setActiveModalTask] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setData(res.data || {});
    } catch (err) {
      setData({});
      showError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="desktop-only page-header">
          <div>
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-subtitle">Real-time workforce workload & task flow telemetry</p>
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ height: '140px', padding: '1.5rem' }}>
              <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ width: '60%', height: '32px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const employeeWorkloads = Array.isArray(data?.employeeWorkloads) ? data.employeeWorkloads : [];
  const departmentStats = Array.isArray(data?.departmentStats) ? data.departmentStats : [];
  const attentionTasks = Array.isArray(data?.attentionTasks) ? data.attentionTasks : [];

  return (
    <div className="dashboard-wrapper">
      {/* =========================================================================
          MOBILE VIEW: Inspired by the Reference Modern Fintech/App Layout
          ========================================================================= */}
      <div className="mobile-only mobile-dashboard-view">
        {/* Hero Section: "Your balance" style */}
        <section className="mobile-hero-section">
          <span className="mobile-hero-subtitle">Workforce & Task Pulse</span>
          <div className="mobile-hero-balance">
            <span className="mobile-balance-number">
              {overview?.tasks?.active ?? 0}
            </span>
            <span className="mobile-balance-unit">Tasks in Flight</span>
          </div>
          <div className="mobile-hero-meta">
            <span className="mobile-meta-pill overdue">
              <AlertTriangle size={12} />
              {overview?.tasks?.overdue ?? 0} Overdue
            </span>
            <span className="mobile-meta-pill resolution">
              <CheckCircle2 size={12} />
              {overview?.tasks?.completionRate ?? 0}% Resolution
            </span>
          </div>
        </section>

        {/* Horizontal Swipeable Gradient Cards Carousel (Like pink & cyan cards) */}
        <section className="mobile-carousel-section">
          <div className="mobile-cards-carousel">
            {/* Card 1: Vibrant Hot Pink / Magenta / Violet Gradient (Urgent / Overdue) */}
            <Link
              to="/tasks?isOverdue=true"
              className="mobile-gradient-card card-magenta"
            >
              <div className="card-top-row">
                <span className="card-brand-label">OVERDUE</span>
                <span className="card-type-label">High Priority</span>
              </div>
              <div className="card-metric-row">
                <span className="card-big-value">
                  {overview?.tasks?.overdue ?? 0}
                </span>
                <span className="card-metric-unit">Tasks</span>
              </div>
              <div className="card-bottom-row">
                <span className="card-subtext">Immediate action required</span>
                <span className="card-bullet-accent">●●●</span>
              </div>
            </Link>

            {/* Card 2: Vibrant Electric Cyan / Sky Blue Gradient (Active / In Progress) */}
            <Link
              to="/tasks?status=In Progress"
              className="mobile-gradient-card card-cyan"
            >
              <div className="card-top-row">
                <span className="card-brand-label">PIPELINE</span>
                <span className="card-type-label">In Progress</span>
              </div>
              <div className="card-metric-row">
                <span className="card-big-value">
                  {overview?.tasks?.inProgress ?? 0}
                </span>
                <span className="card-metric-unit">Active</span>
              </div>
              <div className="card-bottom-row">
                <span className="card-subtext">
                  •• {overview?.tasks?.todo ?? 0} todo in queue
                </span>
                <span className="card-bullet-accent">● 4552</span>
              </div>
            </Link>

            {/* Card 3: Vibrant Emerald / Mint Gradient (Resolution / Completed) */}
            <Link
              to="/tasks?status=Completed"
              className="mobile-gradient-card card-emerald"
            >
              <div className="card-top-row">
                <span className="card-brand-label">RESOLUTION</span>
                <span className="card-type-label">Success Rate</span>
              </div>
              <div className="card-metric-row">
                <span className="card-big-value">
                  {overview?.tasks?.completionRate ?? 0}%
                </span>
                <span className="card-metric-unit">Rate</span>
              </div>
              <div className="card-bottom-row">
                <span className="card-subtext">
                  •• {overview?.tasks?.completed ?? 0} tasks resolved
                </span>
                <span className="card-bullet-accent">● 9811</span>
              </div>
            </Link>

            {/* Card 4: Royal Violet / Deep Indigo Gradient (Workforce) */}
            <Link
              to="/employees"
              className="mobile-gradient-card card-indigo"
            >
              <div className="card-top-row">
                <span className="card-brand-label">WORKFORCE</span>
                <span className="card-type-label">Staffing</span>
              </div>
              <div className="card-metric-row">
                <span className="card-big-value">
                  {overview?.employees?.total ?? 0}
                </span>
                <span className="card-metric-unit">Staff</span>
              </div>
              <div className="card-bottom-row">
                <span className="card-subtext">
                  •• {overview?.employees?.active ?? 0} active on duty
                </span>
                <span className="card-bullet-accent">● 2026</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Quick Actions Grid ("Finance" style from inspiration image) */}
        <section className="mobile-quick-actions-section">
          <h2 className="mobile-section-heading">OPERATIONS</h2>
          <div className="mobile-quick-actions-grid">
            <Link to="/tasks/new" className="mobile-action-tile">
              <div className="mobile-action-icon-badge badge-magenta">
                <Star size={20} />
              </div>
              <span className="mobile-action-label">Assign Task</span>
            </Link>

            <Link to="/employees" className="mobile-action-tile">
              <div className="mobile-action-icon-badge badge-cyan">
                <Briefcase size={20} />
              </div>
              <span className="mobile-action-label">Workforce</span>
            </Link>

            <Link to="/tasks" className="mobile-action-tile">
              <div className="mobile-action-icon-badge badge-amber">
                <FileText size={20} />
              </div>
              <span className="mobile-action-label">Task Board</span>
            </Link>
          </div>
        </section>

        {/* Current / Urgent Tasks List ("CURRENT LOANS" style with `+` in inspiration image) */}
        <section className="mobile-list-section">
          <div className="mobile-section-header-row">
            <h2 className="mobile-section-heading">CURRENT & URGENT TASKS</h2>
            <Link
              to="/tasks/new"
              className="mobile-section-plus-btn"
              title="Add Task"
              aria-label="Add Task"
            >
              <Plus size={18} />
            </Link>
          </div>

          <div className="mobile-task-cards-list">
            {(attentionTasks || []).length === 0 ? (
              <div className="mobile-empty-card">
                <CheckCircle2 size={32} style={{ color: 'var(--success)' }} />
                <h4>All Tasks On Track</h4>
                <p>No overdue or critical tasks pending right now.</p>
              </div>
            ) : (
              attentionTasks.slice(0, 5).map((t) => (
                <div key={t._id} className="mobile-task-item-card">
                  <div className="mobile-task-item-left">
                    <div
                      className={`mobile-task-icon-box ${
                        t.isOverdue ? 'overdue' : 'active'
                      }`}
                    >
                      {t.isOverdue ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <CheckSquare size={18} />
                      )}
                    </div>
                    <div className="mobile-task-text-meta">
                      <Link
                        to={`/tasks/${t._id}`}
                        className="mobile-task-title-link"
                      >
                        Task № {t._id?.slice(-6) || 'TASK'}
                      </Link>
                      <div className="mobile-task-sub-meta">
                        <span>
                          Expires {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                        <span>• {t.department}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mobile-task-item-right">
                    <span
                      className={`mobile-task-rate-badge ${
                        t.priority === 'Urgent' ? 'urgent' : ''
                      }`}
                    >
                      {t.priority}
                    </span>
                    <button
                      className="mobile-task-quick-update"
                      onClick={() => setActiveModalTask(t)}
                    >
                      Status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Team Workload Capacities on Mobile */}
        <section className="mobile-workload-section">
          <div className="mobile-section-header-row">
            <h2 className="mobile-section-heading">WORKFORCE CAPACITY</h2>
            <Link to="/employees" className="mobile-section-text-link">
              View All
            </Link>
          </div>

          <div className="mobile-workload-cards">
            {employeeWorkloads.slice(0, 5).map((emp) => (
              <div key={emp._id} className="mobile-workload-card">
                <div className="mobile-workload-header">
                  <div>
                    <Link
                      to={`/employees/${emp._id}`}
                      className="mobile-workload-name"
                    >
                      {emp.name}
                    </Link>
                    <span className="mobile-workload-dept">
                      {emp.department} • {emp.employeeId}
                    </span>
                  </div>
                  <span
                    className={`mobile-workload-count ${
                      emp.isAtCapacity ? 'at-capacity' : ''
                    }`}
                  >
                    {emp.activeTasksCount} / 3 Tasks
                  </span>
                </div>
                <WorkloadBar
                  activeCount={emp.activeTasksCount}
                  max={3}
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* =========================================================================
          DESKTOP VIEW: Preserved & High-Fidelity Executive Telemetry
          ========================================================================= */}
      <div className="desktop-only desktop-dashboard-view">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <Layers size={28} style={{ color: 'var(--primary)' }} />
              Executive Dashboard
            </h1>
            <p className="page-subtitle">
              Overview of employee capacities, department distribution, and task execution
            </p>
          </div>
          <div className="header-actions">
            <Link to="/tasks/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Task</span>
            </Link>
          </div>
        </div>

        {/* Top Stat Cards (Matching Image 3 Reference Design) */}
        <div className="stats-grid">
          {/* Card 1: Total Workforce */}
          <div className="stat-card card-indigo">
            <div className="card-top-row">
              <span className="card-brand-label">WORKFORCE</span>
              <span className="card-type-label">Staffing</span>
            </div>
            <div className="card-metric-row">
              <span className="card-big-value">{overview?.employees?.total || 0}</span>
              <span className="card-metric-unit">Staff</span>
            </div>
            <div className="card-bottom-row">
              <span className="card-subtext">
                •• {overview?.employees?.active || 0} active • {overview?.employees?.onLeave || 0} on leave
              </span>
              <span className="card-bullet-accent">● 2026</span>
            </div>
          </div>

          {/* Card 2: Active Pipeline */}
          <div className="stat-card card-cyan">
            <div className="card-top-row">
              <span className="card-brand-label">PIPELINE</span>
              <span className="card-type-label">In Progress</span>
            </div>
            <div className="card-metric-row">
              <span className="card-big-value">{overview?.tasks?.active || 0}</span>
              <span className="card-metric-unit">Active</span>
            </div>
            <div className="card-bottom-row">
              <span className="card-subtext">
                •• {overview?.tasks?.inProgress || 0} in progress, {overview?.tasks?.todo || 0} todo
              </span>
              <span className="card-bullet-accent">● 4552</span>
            </div>
          </div>

          {/* Card 3: Overdue Tasks */}
          <div className="stat-card card-magenta">
            <div className="card-top-row">
              <span className="card-brand-label">OVERDUE</span>
              <span className="card-type-label">High Priority</span>
            </div>
            <div className="card-metric-row">
              <span className="card-big-value">{overview?.tasks?.overdue || 0}</span>
              <span className="card-metric-unit">Tasks</span>
            </div>
            <div className="card-bottom-row">
              <span className="card-subtext">
                {overview?.tasks?.overdue > 0 ? 'Immediate action required' : 'All tasks on schedule'}
              </span>
              <span className="card-bullet-accent">●●●</span>
            </div>
          </div>

          {/* Card 4: Completed Tasks */}
          <div className="stat-card card-emerald">
            <div className="card-top-row">
              <span className="card-brand-label">RESOLUTION</span>
              <span className="card-type-label">Success Rate</span>
            </div>
            <div className="card-metric-row">
              <span className="card-big-value">{overview?.tasks?.completionRate || 0}%</span>
              <span className="card-metric-unit">Rate</span>
            </div>
            <div className="card-bottom-row">
              <span className="card-subtext">
                •• {overview?.tasks?.completed || 0} tasks resolved
              </span>
              <span className="card-bullet-accent">● 9811</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Workload & Urgent Attention */}
        <div className="dashboard-main-grid">
          {/* Employee Workload Capacity Widget */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Briefcase size={20} style={{ color: 'var(--primary)' }} />
                Employee Workload & Capacity
              </h3>
              <Link to="/employees" className="btn btn-outline btn-sm">
                View All ({(employeeWorkloads || []).length})
              </Link>
            </div>
            <div
              className="card-body"
              style={{
                maxHeight: '420px',
                overflowY: 'auto',
                padding: '1rem 1.5rem',
              }}
            >
              {(employeeWorkloads || []).length === 0 ? (
                <p
                  style={{
                    color: 'var(--neutral-500)',
                    textAlign: 'center',
                    padding: '2rem',
                  }}
                >
                  No employees found
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {employeeWorkloads.map((emp) => (
                    <div
                      key={emp._id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--neutral-50)',
                        border: '1px solid var(--neutral-200)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div>
                          <Link
                            to={`/employees/${emp._id}`}
                            style={{
                              fontWeight: 700,
                              color: 'var(--neutral-900)',
                              textDecoration: 'none',
                              fontSize: '0.925rem',
                            }}
                          >
                            {emp.name}
                          </Link>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '0.15rem',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--neutral-500)',
                              }}
                            >
                              {emp.employeeId}
                            </span>
                            <DepartmentBadge department={emp.department} />
                            <StatusBadge status={emp.status} isEmployee />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: emp.isAtCapacity
                                ? 'var(--danger)'
                                : 'var(--neutral-700)',
                            }}
                          >
                            {emp.activeTasksCount} / 3 Tasks
                          </span>
                        </div>
                      </div>
                      <WorkloadBar
                        activeCount={emp.activeTasksCount}
                        max={3}
                        showLabel={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Attention Required Widget (Overdue & Urgent Tasks) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                Attention Required
              </h3>
              <Link
                to="/tasks?isOverdue=true"
                className="btn btn-danger-outline btn-sm"
              >
                View All Overdue ({overview?.tasks?.overdue || 0})
              </Link>
            </div>
            <div
              className="card-body"
              style={{
                maxHeight: '420px',
                overflowY: 'auto',
                padding: '1rem 1.5rem',
              }}
            >
              {(attentionTasks || []).length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem',
                    color: 'var(--success-text)',
                  }}
                >
                  <CheckCircle2
                    size={36}
                    style={{ margin: '0 auto 0.75rem', color: 'var(--success)' }}
                  />
                  <h4 style={{ fontWeight: 700, color: 'var(--neutral-800)' }}>
                    All Clear!
                  </h4>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--neutral-500)',
                    }}
                  >
                    No overdue or critical tasks pending.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  {attentionTasks.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: t.isOverdue ? '#fff8f8' : 'var(--neutral-50)',
                        border: t.isOverdue
                          ? '1px solid #fecaca'
                          : '1px solid var(--neutral-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ maxWidth: '65%' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <PriorityBadge priority={t.priority} />
                          {t.isOverdue && (
                            <OverdueBadge isOverdue dueDate={t.dueDate} />
                          )}
                          <StatusBadge status={t.status} />
                        </div>
                        <Link
                          to={`/tasks/${t._id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--neutral-900)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.title}
                        </Link>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--neutral-500)',
                          }}
                        >
                          Assigned to: {t.assignedEmployee?.name || 'Unassigned'} •
                          Due: {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveModalTask(t)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Update Status
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Department Breakdown Cards */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={20} style={{ color: 'var(--primary)' }} />
              Departmental Distribution
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
              5 Business Units
            </span>
          </div>
          <div className="card-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {departmentStats.map((dept) => (
                <div
                  key={dept.department}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--neutral-50)',
                    border: '1px solid var(--neutral-200)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <DepartmentBadge department={dept.department} />
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--neutral-600)',
                      }}
                    >
                      {dept.employeeCount} Staff
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: 'var(--neutral-500)' }}>Active Tasks:</span>
                    <strong style={{ color: 'var(--neutral-900)' }}>
                      {dept.activeTasks}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: 'var(--neutral-500)' }}>Completed:</span>
                    <strong style={{ color: 'var(--success-text)' }}>
                      {dept.completedTasks}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ color: 'var(--neutral-500)' }}>Overdue:</span>
                    <strong
                      style={{
                        color:
                          dept.overdueTasks > 0
                            ? 'var(--danger)'
                            : 'var(--neutral-500)',
                      }}
                    >
                      {dept.overdueTasks}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {activeModalTask && (
        <StatusModal
          task={activeModalTask}
          isOpen={!!activeModalTask}
          onClose={() => setActiveModalTask(null)}
          onStatusUpdated={() => {
            fetchStats();
            setActiveModalTask(null);
          }}
        />
      )}
    </div>
  );
}
