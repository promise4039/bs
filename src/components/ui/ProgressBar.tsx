export interface ProgressBarProps {
  value: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  /** 색상을 직접 지정 (기본: 비율에 따라 자동 결정) */
  color?: string;
}

const sizeStyles: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',       /* 4px */
  md: 'h-1.5',     /* 6px */
  lg: 'h-2',       /* 8px */
};

function getBarColor(ratio: number): string {
  if (ratio > 1.0) return 'bg-progress-danger';
  if (ratio >= 0.7) return 'bg-progress-warning';
  return 'bg-progress-normal';
}

export function ProgressBar({
  value,
  max,
  size = 'md',
  showLabel = false,
  className = '',
  color,
}: ProgressBarProps) {
  const ratio = max > 0 ? value / max : 0;
  const widthPercent = Math.min(ratio * 100, 100);
  const displayPercent = Math.round(ratio * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-progress-bg rounded-full ${sizeStyles[size]} overflow-hidden`}>
        <div
          className={`${sizeStyles[size]} rounded-full transition-all duration-500 ease-out ${
            color ? '' : getBarColor(ratio)
          }`}
          style={{
            width: `${widthPercent}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] text-text-secondary tabular-nums whitespace-nowrap">
          {displayPercent}%
        </span>
      )}
    </div>
  );
}
