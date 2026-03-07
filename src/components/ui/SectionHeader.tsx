export interface SectionHeaderProps {
  title: string;
  rightLabel?: string;
  onRightClick?: () => void;
}

export function SectionHeader({ title, rightLabel, onRightClick }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center px-1 mb-3">
      <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
      {rightLabel && (
        <button
          className="text-[13px] text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors bg-transparent border-none"
          onClick={onRightClick}
        >
          {rightLabel}
        </button>
      )}
    </div>
  );
}
