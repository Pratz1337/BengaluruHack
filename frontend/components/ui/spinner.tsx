import React from "react";

export const Spinner: React.FC<{ size?: "small" | "medium" | "large" }> = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-gray-900 ${sizeClasses[size]}`}></div>
  );
};

