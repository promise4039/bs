export interface SectionHeaderProps {
  title: string;
  rightLabel?: string;
  onRightClick?: () => void;
}

export function SectionHeader({ title, rightLabel, onRightClick }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center px-1 mb-3">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {rightLabel && (
        <button
          className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors bg-transparent border-none"
          onClick={onRightClick}
        >
          {rightLabel}
        </button>
      )}
    </div>
  );
}
