import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EmployeeList from './pages/EmployeeList.jsx';
import EmployeeForm from './pages/EmployeeForm.jsx';
import EmployeeDetails from './pages/EmployeeDetails.jsx';
import TaskList from './pages/TaskList.jsx';
import TaskForm from './pages/TaskForm.jsx';
import TaskDetails from './pages/TaskDetails.jsx';

export default function App() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {/* Enterprise SaaS Sidebar (Persistent on desktop, drawer on mobile) */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Viewport */}
      <div className="layout-body">
        <Navbar onToggleMobileMenu={() => setMobileSidebarOpen(true)} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Employee Routes */}
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeDetails />} />

            {/* Task Routes */}
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/tasks/:id/edit" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>
            Roots Media Marketing • Technical Assessment • Employee & Task Management System
          </p>
        </footer>
      </div>

      {/* Clean Light Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
