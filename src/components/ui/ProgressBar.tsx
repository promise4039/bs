export interface ProgressBarProps {
  value: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeStyles: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

function getBarStyle(ratio: number): string {
  if (ratio > 1.0) return 'bg-gradient-to-r from-progress-danger/80 to-progress-danger';
  if (ratio >= 0.7) return 'bg-gradient-to-r from-progress-warning/80 to-progress-warning';
  return 'bg-gradient-to-r from-progress-normal/80 to-progress-normal';
}

export function ProgressBar({
  value,
  max,
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const ratio = max > 0 ? value / max : 0;
  const widthPercent = Math.min(ratio * 100, 100);
  const displayPercent = Math.round(ratio * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-progress-bg/60 rounded-full ${sizeStyles[size]} overflow-hidden`}>
        <div
          className={`${sizeStyles[size]} rounded-full ${getBarStyle(ratio)} transition-all duration-500`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-secondary whitespace-nowrap">
          {displayPercent}%
        </span>
      )}
    </div>
  );
}
