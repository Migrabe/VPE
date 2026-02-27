import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "option" | "primary" | "icon";
  children: ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  active = false,
  variant = "option",
  className = "",
  children,
  ...props
}) => {
  let baseClass = "option-btn";

  if (variant === "primary") {
    baseClass = "action-btn"; // We can define this glow class
  } else if (variant === "icon") {
    baseClass = "icon-btn";
  }

  const activeClass = active ? "active" : "";

  return (
    <button
      className={`${baseClass} ${activeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
