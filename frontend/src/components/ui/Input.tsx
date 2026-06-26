import React, { useState, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: error ? 'var(--color-error)' : 'var(--color-text-muted)',
    transition: 'color 0.2s ease',
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid',
    borderColor: error 
      ? 'var(--color-error)' 
      : isFocused 
        ? 'var(--color-accent)' 
        : 'var(--color-border)',
    borderRadius: '12px',
    padding: leftIcon ? '12px 12px 12px 44px' : '12px 16px',
    fontSize: '14px',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isFocused && !error ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
    ...style,
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isFocused ? 'var(--color-accent)' : 'var(--color-text-muted)',
    transition: 'color 0.2s ease',
    pointerEvents: 'none',
  };

  const statusTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: error ? 'var(--color-error)' : 'var(--color-text-muted)',
    marginTop: '2px',
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        {leftIcon && <div style={iconStyle}>{leftIcon}</div>}
        <input
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={inputBaseStyle}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <span style={statusTextStyle}>{error || helperText}</span>
      )}
    </div>
  );
};

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%',
      marginBottom: '16px',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '14px',
      fontWeight: 600,
      color: error ? 'var(--color-error)' : 'var(--color-text-muted)',
    };

    const selectWrapperStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    };

    const selectBaseStyle: React.CSSProperties = {
      width: '100%',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid',
      borderColor: error 
        ? 'var(--color-error)' 
        : isFocused 
          ? 'var(--color-accent)' 
          : 'var(--color-border)',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '14px',
      color: 'var(--color-text)',
      outline: 'none',
      appearance: 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isFocused && !error ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
      cursor: 'pointer',
      ...style,
    };

    const arrowStyle: React.CSSProperties = {
      position: 'absolute',
      right: '16px',
      pointerEvents: 'none',
      color: isFocused ? 'var(--color-accent)' : 'var(--color-text-muted)',
      display: 'flex',
      alignItems: 'center',
    };

    return (
      <div style={containerStyle}>
        {label && <label style={labelStyle}>{label}</label>}
        <div style={selectWrapperStyle}>
          <select
            ref={ref}
            style={selectBaseStyle}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--color-surface)' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={arrowStyle}>
            <ChevronDown size={18} />
          </div>
        </div>
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '2px' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
