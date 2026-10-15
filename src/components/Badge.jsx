import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export function DepartmentBadge({ department }) {
  if (!department) return null;
  const deptClass = `badge-dept-${department.toLowerCase()}`;
  return <span className={`badge ${deptClass}`}>{department}</span>;
}

export function StatusBadge({ status, isEmployee = false }) {
  if (!status) return null;

  let badgeClass = '';
  let dot = true;

  if (isEmployee) {
    if (status === 'Active') badgeClass = 'badge-active';
    else if (status === 'On Leave') badgeClass = 'badge-on-leave';
    else badgeClass = 'badge-inactive';
  } else {
    // Task status
    if (status === 'Todo') badgeClass = 'badge-todo';
    else if (status === 'In Progress') badgeClass = 'badge-in-progress';
    else if (status === 'Completed') badgeClass = 'badge-completed';
    else if (status === 'Cancelled') badgeClass = 'badge-cancelled';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {dot && <span className="badge-dot" />}
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  const pClass = `badge-priority-${priority.toLowerCase()}`;
  return (
    <span className={`badge ${pClass}`}>
      {priority}
    </span>
  );
}

export function OverdueBadge({ isOverdue, dueDate }) {
  if (!isOverdue) return null;

  let daysOverdue = 0;
  if (dueDate) {
    const diffTime = Math.abs(new Date() - new Date(dueDate));
    daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <span className="badge badge-overdue" title="Overdue task requires immediate action">
      <AlertTriangle size={12} />
      <span>Overdue {daysOverdue > 0 ? `(${daysOverdue}d)` : ''}</span>
    </span>
  );
}
