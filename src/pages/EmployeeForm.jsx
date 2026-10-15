import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Users, ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import { getEmployeeById, createEmployee, updateEmployee } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';

const DEPARTMENTS = ['Development', 'Design', 'QA', 'HR', 'Sales'];
const STATUSES = ['Active', 'Inactive', 'On Leave'];

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    department: 'Development',
    designation: '',
    phone: '',
    status: 'Active',
    leaveStartDate: '',
    leaveEndDate: '',
  });

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchEmployee = async () => {
        try {
          setLoading(true);
          const res = await getEmployeeById(id);
          const emp = res.data.employee;
          setFormData({
            employeeId: emp.employeeId || '',
            name: emp.name || '',
            email: emp.email || '',
            department: emp.department || 'Development',
            designation: emp.designation || '',
            phone: emp.phone || '',
            status: emp.status || 'Active',
            leaveStartDate: emp.leaveStartDate ? emp.leaveStartDate.split('T')[0] : '',
            leaveEndDate: emp.leaveEndDate ? emp.leaveEndDate.split('T')[0] : '',
          });
        } catch (err) {
          showError(err.message || 'Failed to load employee details');
          navigate('/employees');
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [id, isEdit]);

  const validate = () => {
    const errs = {};
    if (!formData.employeeId.trim()) {
      errs.employeeId = 'Employee ID is required';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.employeeId.trim())) {
      errs.employeeId = 'Employee ID can only contain letters, numbers, hyphens, and underscores';
    }

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    if (!formData.department) {
      errs.department = 'Department is required';
    }

    if (formData.status === 'On Leave') {
      if (!formData.leaveStartDate) {
        errs.leaveStartDate = 'Leave start date is required';
      }
      if (!formData.leaveEndDate) {
        errs.leaveEndDate = 'Leave end date is required';
      }
      if (formData.leaveStartDate && formData.leaveEndDate) {
        if (new Date(formData.leaveEndDate) < new Date(formData.leaveStartDate)) {
          errs.leaveEndDate = 'Leave end date cannot be earlier than leave start date';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        employeeId: formData.employeeId.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      if (isEdit) {
        await updateEmployee(id, payload);
        showSuccess(`Employee "${payload.name}" updated successfully`);
      } else {
        await createEmployee(payload);
        showSuccess(`Employee "${payload.name}" created successfully`);
      }

      navigate('/employees');
    } catch (err) {
      showError(err.message || 'Error saving employee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '180px' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
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
            marginBottom: '0.75rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Employees
        </Link>
        <h1 className="page-title">
          <Users size={28} style={{ color: 'var(--primary)' }} />
          {isEdit ? 'Edit Employee Profile' : 'Register New Employee'}
        </h1>
        <p className="page-subtitle">
          {isEdit
            ? 'Update profile details, department alignment, and leave schedule'
            : 'Add a new team member to your workforce management system'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="form-grid">
              {/* Employee ID */}
              <div className="form-group">
                <label className="form-label" htmlFor="employeeId">
                  Employee ID <span className="form-label-required">*</span>
                </label>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  placeholder="e.g. EMP007"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                {errors.employeeId && <span className="form-error">{errors.employeeId}</span>}
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name <span className="form-label-required">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Work Email <span className="form-label-required">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. jane.doe@rootsmedia.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
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

              {/* Designation */}
              <div className="form-group">
                <label className="form-label" htmlFor="designation">
                  Designation / Role Title
                </label>
                <input
                  id="designation"
                  name="designation"
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  value={formData.designation}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="e.g. +1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              {/* Status */}
              <div className="form-group col-span-2">
                <label className="form-label" htmlFor="status">
                  Employment Status <span className="form-label-required">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st} {st === 'Inactive' ? '(Cannot be assigned tasks)' : ''}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Per business rules, Inactive employees cannot receive tasks. On Leave employees cannot receive tasks starting during leave.
                </span>
              </div>

              {/* Leave Dates Section (Conditional) */}
              {formData.status === 'On Leave' && (
                <div
                  className="col-span-2"
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fef3c7',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                  }}
                >
                  <div className="form-group">
                    <label className="form-label" htmlFor="leaveStartDate">
                      <Calendar size={15} style={{ color: 'var(--warning-text)' }} />
                      Leave Start Date <span className="form-label-required">*</span>
                    </label>
                    <input
                      id="leaveStartDate"
                      name="leaveStartDate"
                      type="date"
                      value={formData.leaveStartDate}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    {errors.leaveStartDate && (
                      <span className="form-error">{errors.leaveStartDate}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="leaveEndDate">
                      <Calendar size={15} style={{ color: 'var(--warning-text)' }} />
                      Leave End Date <span className="form-label-required">*</span>
                    </label>
                    <input
                      id="leaveEndDate"
                      name="leaveEndDate"
                      type="date"
                      value={formData.leaveEndDate}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    {errors.leaveEndDate && (
                      <span className="form-error">{errors.leaveEndDate}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link to="/employees" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEdit ? 'Save Changes' : 'Create Employee'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
