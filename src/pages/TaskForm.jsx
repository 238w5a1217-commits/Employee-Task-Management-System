import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckSquare, ArrowLeft, Save, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { getTaskById, createTask, updateTask, getEmployees } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';

const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEmpId = searchParams.get('employeeId') || '';

  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'Development',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedEmployee: preselectedEmpId,
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        // Fetch all active/on-leave employees for assignment
        const empRes = await getEmployees({ limit: 100 });
        setEmployees(empRes.data.employees || []);

        if (isEdit) {
          const taskRes = await getTaskById(id);
          const t = taskRes.data.task;

          // Check if finalized
          if (t.status === 'Completed' || t.status === 'Cancelled') {
            setIsLocked(true);
            showError(`This task is "${t.status}" and cannot be edited. Completed and Cancelled tasks are permanently locked.`);
          }

          setFormData({
            title: t.title || '',
            description: t.description || '',
            department: t.department || 'Development',
            priority: t.priority || 'Medium',
            startDate: t.startDate ? t.startDate.split('T')[0] : '',
            dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
            assignedEmployee: t.assignedEmployee?._id || '',
          });
        }
      } catch (err) {
        showError(err.message || 'Failed to initialize form');
        navigate('/tasks');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEdit]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters';
    }

    if (!formData.department) {
      errs.department = 'Department is required';
    }

    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }

    if (!formData.dueDate) {
      errs.dueDate = 'Due date is required';
    }

    if (formData.startDate && formData.dueDate) {
      if (new Date(formData.dueDate) < new Date(formData.startDate)) {
        errs.dueDate = 'Due date cannot be earlier than start date';
      }
    }

    if (!formData.assignedEmployee) {
      errs.assignedEmployee = 'An assigned employee is required';
    } else {
      const selectedEmp = employees.find((e) => e._id === formData.assignedEmployee);
      if (selectedEmp) {
        if (selectedEmp.status === 'Inactive') {
          errs.assignedEmployee = 'Cannot assign tasks to an Inactive employee';
        }
        // Capacity check: if assigning to an employee who already has 3 active tasks (and not currently assigned to this task)
        const isCurrentlyAssigned = isEdit && selectedEmp._id === formData.assignedEmployee;
        if (!isCurrentlyAssigned && selectedEmp.activeTasksCount >= 3) {
          errs.assignedEmployee = `Employee has reached maximum capacity of 3 active tasks (${selectedEmp.activeTasksCount}/3)`;
        }
        // Leave check
        if (selectedEmp.status === 'On Leave' && selectedEmp.leaveStartDate && selectedEmp.leaveEndDate && formData.startDate) {
          const taskStart = new Date(formData.startDate);
          taskStart.setHours(0, 0, 0, 0);
          const leaveStart = new Date(selectedEmp.leaveStartDate);
          leaveStart.setHours(0, 0, 0, 0);
          const leaveEnd = new Date(selectedEmp.leaveEndDate);
          leaveEnd.setHours(23, 59, 59, 999);

          if (taskStart >= leaveStart && taskStart <= leaveEnd) {
            errs.assignedEmployee = `Task start date falls during ${selectedEmp.name}'s leave period (${new Date(selectedEmp.leaveStartDate).toLocaleDateString()} to ${new Date(selectedEmp.leaveEndDate).toLocaleDateString()})`;
          }
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      if (isEdit) {
        await updateTask(id, payload);
        showSuccess(`Task "${payload.title}" updated successfully`);
      } else {
        await createTask(payload);
        showSuccess(`Task "${payload.title}" created in Todo status`);
      }

      navigate('/tasks');
    } catch (err) {
      showError(err.message || 'Error saving task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '220px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
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
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Tasks
        </Link>
        <h1 className="page-title">
          <CheckSquare size={28} style={{ color: 'var(--primary)' }} />
          {isEdit ? 'Edit Task Details' : 'Create & Assign New Task'}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? 'Update task scope, priority, deadlines, or reassignment'
            : 'Initialize task in Todo status and assign to an active employee within capacity'}
        </p>
      </div>

      {isLocked && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={20} />
          <span>
            <strong>Locked Record:</strong> Completed and Cancelled tasks cannot be edited. Form fields are read-only.
          </span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="form-grid">
              {/* Title */}
              <div className="form-group col-span-2">
                <label className="form-label" htmlFor="title">
                  Task Title <span className="form-label-required">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. Implement Responsive UI Components"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isLocked}
                  required
                />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              {/* Description */}
              <div className="form-group col-span-2">
                <label className="form-label" htmlFor="description">
                  Task Description & Requirements
                </label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Provide detailed deliverables, links, or notes..."
                  value={formData.description}
                  onChange={handleChange}
                  className="form-textarea"
                  disabled={isLocked}
                />
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department <span className="form-label-required">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLocked}
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && <span className="form-error">{errors.department}</span>}
              </div>

              {/* Priority */}
              <div className="form-group">
                <label className="form-label" htmlFor="priority">
                  Priority Level <span className="form-label-required">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLocked}
                  required
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="startDate">
                  <Calendar size={15} />
                  Start Date <span className="form-label-required">*</span>
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isLocked}
                  required
                />
                {errors.startDate && <span className="form-error">{errors.startDate}</span>}
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="dueDate">
                  <Calendar size={15} />
                  Due Date <span className="form-label-required">*</span>
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isLocked}
                  required
                />
                {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
                <span className="form-hint">Due date cannot be earlier than start date</span>
              </div>

              {/* Assigned Employee */}
              <div className="form-group col-span-2">
                <label className="form-label" htmlFor="assignedEmployee">
                  Assign to Employee <span className="form-label-required">*</span>
                </label>
                <select
                  id="assignedEmployee"
                  name="assignedEmployee"
                  value={formData.assignedEmployee}
                  onChange={handleChange}
                  className="form-select"
                  disabled={isLocked}
                  required
                >
                  <option value="">-- Select Active Employee --</option>
                  {employees.map((emp) => {
                    const isInactive = emp.status === 'Inactive';
                    const isAtCapacity = emp.activeTasksCount >= 3 && emp._id !== formData.assignedEmployee;
                    const isOnLeave = emp.status === 'On Leave';

                    let labelSuffix = `(${emp.department}) • ${emp.activeTasksCount}/3 active tasks`;
                    if (isInactive) labelSuffix += ' [INACTIVE - Cannot Assign]';
                    else if (isAtCapacity) labelSuffix += ' [MAX CAPACITY 3/3]';
                    else if (isOnLeave) labelSuffix += ' [ON LEAVE]';

                    return (
                      <option
                        key={emp._id}
                        value={emp._id}
                        disabled={isInactive || isAtCapacity}
                      >
                        {emp.name} {labelSuffix}
                      </option>
                    );
                  })}
                </select>
                {errors.assignedEmployee && (
                  <span className="form-error">{errors.assignedEmployee}</span>
                )}
                <span className="form-hint">
                  Strict rules: Inactive employees are blocked. Max 3 active tasks allowed per employee. On-leave employees blocked if start date falls in leave period.
                </span>
              </div>
            </div>
          </div>

          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link to="/tasks" className="btn btn-secondary">
              Cancel
            </Link>
            {!isLocked && (
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEdit ? 'Save Changes' : 'Create Task'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
