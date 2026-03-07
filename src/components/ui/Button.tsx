export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonProps['variant'], string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-bg-elevated text-text-primary hover:bg-bg-card-hover',
  danger: 'bg-red-500/10 text-expense hover:bg-red-500/20',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-3 px-4 text-base',
  lg: 'py-4 px-6 text-lg',
};

export function Button({
  variant,
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      className={`rounded-[12px] font-semibold transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
