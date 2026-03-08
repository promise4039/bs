export interface SectionHeaderProps {
  title: string;
  rightLabel?: string;
  onRightClick?: () => void;
  /** 하단 마진 크기 조절 */
  spacing?: 'sm' | 'md' | 'lg';
}

const spacingStyles = {
  sm: 'mb-2',
  md: 'mb-3',
  lg: 'mb-4',
};

export function SectionHeader({
  title,
  rightLabel,
  onRightClick,
  spacing = 'md',
}: SectionHeaderProps) {
  return (
    <div className={`flex justify-between items-center px-1 ${spacingStyles[spacing]}`}>
      <h2 className="text-[15px] font-semibold text-text-primary leading-tight">{title}</h2>
      {rightLabel && (
        <button
          className="text-[13px] text-text-tertiary cursor-pointer hover:text-text-secondary active:text-text-secondary transition-colors duration-150 bg-transparent border-none p-0"
          onClick={onRightClick}
        >
          {rightLabel}
        </button>
      )}
    </div>
  );
}
