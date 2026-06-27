import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-accent)',
          color: 'white',
          border: '1px solid var(--color-accent)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-accent)',
          border: '2px solid var(--color-accent)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent',
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-error)',
          border: '1px solid var(--color-error)',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '8px 16px', fontSize: '13px' };
      case 'lg':
        return { padding: '16px 32px', fontSize: '16px' };
      default:
        return { padding: '12px 24px', fontSize: '14px' };
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || isLoading ? 0.6 : 1,
    outline: 'none',
    userSelect: 'none',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={baseStyles}
      onMouseOver={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.filter = 'brightness(1.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.filter = 'none';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
        }
      }}
      {...props}
    >
      {isLoading && (
        <span style={{ 
          width: '16px', 
          height: '16px', 
          border: '2px solid rgba(255,255,255,0.3)', 
          borderTopColor: 'white', 
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      ` }} />
    </button>
  );
};
