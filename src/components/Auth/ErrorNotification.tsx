import React, { useEffect, useState } from "react";
import "./Auth.css";

interface ErrorNotificationProps {
  error: string | null;
  onClose: () => void;
  type?: "error" | "warning" | "success" | "info";
  title?: string;
  duration?: number;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  type = "error",
  title,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsClosing(false);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [error, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!error || !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
      default:
        return "❌";
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      case "success":
        return "Success";
      case "info":
        return "Info";
      default:
        return "Error";
    }
  };

  return (
    <div className={`error-notification ${type} ${isClosing ? "closing" : ""}`}>
      <div className="error-icon">{getIcon()}</div>
      <div className="error-content">
        <div className="error-title">{getTitle()}</div>
        <div className="error-message">{error}</div>
      </div>
      <button className="error-close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export default ErrorNotification;
