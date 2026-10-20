import React from 'react';

interface CornerDecorationsProps {
  showTopLeft?: boolean;
  showBottomRight?: boolean;
  opacity?: number;
}

export const CornerDecorations: React.FC<CornerDecorationsProps> = ({
  showTopLeft = true,
  showBottomRight = true,
  opacity = 1,
}) => {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Top Left Decorative Shape */}
      {showTopLeft && (
        <svg
          className="absolute -top-10 -left-10 w-44 h-44 transition-transform duration-500"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer concentric amber outline arc */}
          <circle
            cx="40"
            cy="40"
            r="105"
            stroke="#F5B83D"
            strokeWidth="3.5"
            fill="none"
            opacity="0.85"
          />
          {/* Inner solid teal filled circle */}
          <circle
            cx="40"
            cy="40"
            r="82"
            fill="#6FA5A5"
          />
        </svg>
      )}

      {/* Bottom Right Decorative Shape */}
      {showBottomRight && (
        <svg
          className="absolute -bottom-12 -right-12 w-48 h-48 transition-transform duration-500"
          viewBox="0 0 180 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer concentric amber outline arc */}
          <circle
            cx="140"
            cy="140"
            r="120"
            stroke="#F5B83D"
            strokeWidth="3.5"
            fill="none"
            opacity="0.85"
          />
          {/* Inner solid teal filled circle */}
          <circle
            cx="140"
            cy="140"
            r="95"
            fill="#6FA5A5"
          />
        </svg>
      )}
    </div>
  );
};
