import React, { type InputHTMLAttributes } from "react";

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: string | number;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  className = "",
  ...props
}) => {
  return (
    <div className={`slider-container ${className}`.trim()}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span className="sub-label" style={{ margin: 0 }}>
            {label}
          </span>
          {valueDisplay !== undefined && (
            <span className="sub-label" style={{ margin: 0 }}>
              {valueDisplay}
            </span>
          )}
        </div>
      )}
      <input type="range" {...props} />
    </div>
  );
};
