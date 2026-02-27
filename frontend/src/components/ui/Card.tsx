import React, { type ReactNode } from "react";

interface CardProps {
  title: string;
  icon?: ReactNode;
  iconColorClass?: string; // e.g. 'icon-purple', 'icon-blue'
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  iconColorClass = "",
  children,
  className = "",
  badge,
  disabled = false,
  style,
}) => {
  return (
    <div
      className={`section ${className} ${disabled ? "disabled-section" : ""}`.trim()}
      style={style}
    >
      <div className="section-header">
        <h2>
          {icon && (
            <span className={`icon ${iconColorClass}`.trim()}>{icon}</span>
          )}
          {title}
          {badge}
        </h2>
      </div>
      {children}
    </div>
  );
};
