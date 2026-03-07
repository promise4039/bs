export interface BadgeProps {
  text: string;
  color?: 'red' | 'green' | 'yellow' | 'gray' | 'blue';
  className?: string;
}

const colorStyles: Record<NonNullable<BadgeProps['color']>, string> = {
  red: 'bg-expense/10 text-expense',
  green: 'bg-income/10 text-income',
  yellow: 'bg-progress-warning/10 text-progress-warning',
  gray: 'bg-bg-elevated text-text-secondary',
  blue: 'bg-accent/10 text-accent',
};

export function Badge({ text, color = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-[6px] px-1.5 py-0.5 text-[10px] font-semibold ${colorStyles[color]} ${className}`}
    >
      {text}
    </span>
  );
}
