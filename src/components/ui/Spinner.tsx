export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`${sizeStyles[size]} border-accent/30 border-t-accent rounded-full animate-spin`}
    />
  );
}
