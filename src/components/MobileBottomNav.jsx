import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Plus,
  Users,
  Search,
  AlertTriangle,
  X,
  Briefcase,
  UserPlus,
} from 'lucide-react';

export default function MobileBottomNav({ onOpenSearch }) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAction = (path) => {
    setShowQuickActions(false);
    navigate(path);
  };

  return (
    <>
      {/* Quick Action Modal / Bottom Sheet */}
      {showQuickActions && (
        <div
          className="mobile-fab-backdrop mobile-only"
          onClick={() => setShowQuickActions(false)}
        >
          <div
            className="mobile-fab-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-fab-sheet-header">
              <span className="mobile-fab-sheet-title">Quick Actions</span>
              <button
                className="mobile-fab-sheet-close"
                onClick={() => setShowQuickActions(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-fab-sheet-options">
              <button
                className="mobile-fab-option-btn primary-action"
                onClick={() => handleAction('/tasks/new')}
              >
                <div className="mobile-fab-option-icon task-icon">
                  <CheckSquare size={20} />
                </div>
                <div className="mobile-fab-option-text">
                  <strong>Assign New Task</strong>
                  <span>Create and delegate a workload task</span>
                </div>
              </button>

              <button
                className="mobile-fab-option-btn secondary-action"
                onClick={() => handleAction('/employees/new')}
              >
                <div className="mobile-fab-option-icon emp-icon">
                  <UserPlus size={20} />
                </div>
                <div className="mobile-fab-option-text">
                  <strong>Add New Employee</strong>
                  <span>Register a team member & set capacity</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="mobile-bottom-nav mobile-only" aria-label="Mobile Bottom Navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `mobile-bottom-item ${isActive ? 'active' : ''}`
          }
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `mobile-bottom-item ${isActive ? 'active' : ''}`
          }
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>

        {/* Center Glowing Elevated FAB */}
        <div className="mobile-bottom-fab-wrapper">
          <button
            type="button"
            className={`mobile-bottom-fab ${showQuickActions ? 'rotate' : ''}`}
            onClick={() => setShowQuickActions(!showQuickActions)}
            aria-label="Create new item"
          >
            <Plus size={26} strokeWidth={2.6} />
          </button>
        </div>

        <NavLink
          to="/employees"
          className={({ isActive }) =>
            `mobile-bottom-item ${isActive ? 'active' : ''}`
          }
        >
          <Users size={20} />
          <span>Workforce</span>
        </NavLink>

        <button
          type="button"
          className={`mobile-bottom-item ${location.search.includes('isOverdue=true') ? 'active' : ''}`}
          onClick={() => {
            if (onOpenSearch) {
              onOpenSearch();
            } else {
              navigate('/tasks?isOverdue=true');
            }
          }}
        >
          <AlertTriangle size={20} />
          <span>Urgent</span>
        </button>
      </nav>
    </>
  );
}
