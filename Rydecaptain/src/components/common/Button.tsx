import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'amber' | 'teal' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  withArrow?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'amber',
  size = 'md',
  fullWidth = true,
  withArrow = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none shadow-sm';

  const sizeClasses = {
    sm: 'text-xs py-2 px-4 rounded-full',
    md: 'text-sm py-3 px-6 rounded-full',
    lg: 'text-base py-3.5 px-7 rounded-full',
  };

  const variantClasses = {
    amber:
      'bg-[#F5B83D] hover:bg-[#e0a32d] text-white shadow-[#F5B83D]/30 shadow-md font-bold',
    teal:
      'bg-[#075B64] hover:bg-[#064a51] text-white shadow-[#075B64]/25 shadow-md font-bold',
    outline:
      'border-2 border-[#075B64] text-[#075B64] hover:bg-[#075B64]/10 bg-transparent font-bold',
    ghost:
      'text-[#075B64] hover:bg-[#075B64]/10 bg-transparent font-semibold',
    danger:
      'bg-red-600 hover:bg-red-700 text-white font-bold',
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      
      <span>{children}</span>

      {withArrow && !loading && (
        <ArrowRight className="w-4 h-4 ml-2 stroke-[2.5]" />
      )}
    </button>
  );
};
