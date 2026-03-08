export interface BadgeProps {
  text: string;
  color?: 'red' | 'green' | 'yellow' | 'gray' | 'blue';
  /** 크기 (default: 'sm') */
  size?: 'xs' | 'sm';
  className?: string;
}

const colorStyles: Record<NonNullable<BadgeProps['color']>, string> = {
  red: 'bg-expense/15 text-expense',
  green: 'bg-income/15 text-income',
  yellow: 'bg-progress-warning/15 text-progress-warning',
  gray: 'bg-bg-elevated text-text-secondary',
  blue: 'bg-accent/15 text-accent',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'px-1.5 py-0.5 text-[9px]',
  sm: 'px-2 py-0.5 text-[10px]',
};

export function Badge({ text, color = 'gray', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[8px] font-semibold leading-tight ${colorStyles[color]} ${sizeStyles[size]} ${className}`}
    >
      {text}
    </span>
  );
}
