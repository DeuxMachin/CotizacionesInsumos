"use client";

import React from "react";
import { FiLoader } from "react-icons/fi";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export function LoadingSpinner({ message, size = "medium" }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6">
      <FiLoader 
        className={`${sizeClasses[size]} animate-spin mb-2`} 
        style={{ color: 'var(--text-secondary)' }} 
      />
      {message && (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {message}
        </p>
      )}
    </div>
  );
}