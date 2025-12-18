import CloseIcon from "@/icons/CloseIcon";
import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to finish before removing from DOM
    setTimeout(() => {
      onClose();
    }, 300); // Matches transition duration
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const bgColors = {
    success: "bg-lime-600/20 border-lime-600/30",
    error: "bg-red-600/20 border-red-600/30",
    info: "bg-blue-600/20 border-blue-600/30",
  };

  return (
    <div
      className={`pointer-events-auto mb-2 flex min-w-[300px] items-center justify-between rounded-lg border px-4 py-3 text-white shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out ${bgColors[type]} ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      role="alert"
    >
      <span className="mr-2 text-sm font-medium">{message}</span>
      <button
        onClick={handleClose}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
