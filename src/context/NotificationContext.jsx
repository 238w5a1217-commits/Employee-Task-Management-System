import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message, duration = 5000) => {
    let cleanMsg = 'An unexpected notification occurred';
    if (typeof message === 'string') {
      cleanMsg = message;
    } else if (message instanceof Error) {
      cleanMsg = message.message;
    } else if (typeof message === 'object' && message !== null) {
      cleanMsg = message.error || message.message || JSON.stringify(message);
    }

    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message: cleanMsg }]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  }, []);

  const showSuccess = useCallback((msg) => addNotification('success', msg), [addNotification]);
  const showError = useCallback((msg) => addNotification('error', msg, 7000), [addNotification]);
  const showInfo = useCallback((msg) => addNotification('info', msg), [addNotification]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {notifications.map((n) => (
          <div key={n.id} className={`toast-item toast-${n.type}`}>
            <div className="toast-icon">
              {n.type === 'success' && <CheckCircle2 size={20} />}
              {n.type === 'error' && <AlertCircle size={20} />}
              {n.type === 'info' && <Info size={20} />}
            </div>
            <div className="toast-content">{n.message}</div>
            <button
              onClick={() => removeNotification(n.id)}
              className="toast-close"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
