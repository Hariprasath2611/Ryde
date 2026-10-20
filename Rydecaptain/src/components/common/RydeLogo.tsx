import React from 'react';

interface RydeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const RydeLogo: React.FC<RydeLogoProps> = ({
  size = 'md',
  withTagline = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'text-xl tracking-tight',
    md: 'text-2xl tracking-tight',
    lg: 'text-3xl tracking-tight',
    xl: 'text-5xl tracking-tight',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className={`font-black flex items-center leading-none ${sizeClasses[size]}`}>
        <span className="text-[#0E525A]">R</span>
        <span className="text-[#ECA233]">y</span>
        <span className="text-[#0E525A]">de</span>
      </div>
      {withTagline && (
        <span className="text-xs font-semibold text-[#1E293B] mt-1.5 tracking-wide lowercase">
          your vehicle , our driver
        </span>
      )}
    </div>
  );
};
