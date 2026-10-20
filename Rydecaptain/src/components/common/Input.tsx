import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}


export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  prefix,
  suffix,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#075B64] mb-1.5 uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-700 font-medium text-sm">
            {prefix}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full bg-white text-slate-800 text-sm font-medium
            border-2 rounded-xl transition-all duration-200
            placeholder:text-slate-400 placeholder:font-normal
            focus:outline-none focus:ring-2 focus:ring-[#075B64]/20
            ${error ? 'border-red-500 focus:border-red-500' : 'border-[#6FA5A5] focus:border-[#075B64]'}
            ${prefix ? 'pl-20 pr-4 py-3' : 'px-4 py-3'}
            ${suffix ? 'pr-11' : ''}
            ${className}
          `}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3.5 flex items-center text-slate-500">
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600 animate-fadeIn">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#075B64]/70">{helperText}</p>
      ) : null}
    </div>
  );
};
