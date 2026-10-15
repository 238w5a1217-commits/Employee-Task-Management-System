import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Plus,
  UserPlus,
  Layers,
  X,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const closeMobile = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop mobile-only"
          onClick={closeMobile}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand / Logo Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={closeMobile}>
            <div className="brand-logo-wrapper">
              <img
                src={logoImg}
                alt="Roots Media Marketing"
                className="brand-logo-img"
              />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Roots Media</span>
              <span className="brand-sub">Marketing</span>
            </div>
          </Link>

          {/* Close button for mobile off-canvas */}
          <button
            className="sidebar-close-btn mobile-only"
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="sidebar-body">
          <div className="sidebar-nav-group">
            <span className="sidebar-group-label">MENU</span>
            <nav className="sidebar-nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMobile}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/employees"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMobile}
              >
                <Users size={18} />
                <span>Employees</span>
              </NavLink>

              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMobile}
              >
                <CheckSquare size={18} />
                <span>Tasks</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Sidebar Workspace Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              <img
                src={logoImg}
                alt="Roots Media Marketing"
                className="sidebar-user-avatar-img"
              />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Roots Media</span>
              <span className="sidebar-user-role">Marketing Suite</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
