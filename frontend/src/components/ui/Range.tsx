import React from "react";

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  postfix?: string;
}

export const Range: React.FC<RangeProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  className = "",
  postfix = "",
}) => {
  return (
    <div className={`range-wrapper ${className}`.trim()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <label className="sub-label" style={{ margin: 0 }}>
          {label}
        </label>
        <span className="sub-label" style={{ margin: 0 }}>
          {value}
          {postfix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};
