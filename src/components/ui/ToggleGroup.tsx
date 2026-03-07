// 필터 토글 버튼 그룹 — [전체] [수입] [지출]

interface ToggleOption {
  label: string;
  value: string;
}

export interface ToggleGroupProps {
  options: ToggleOption[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ToggleGroup({ options, selected, onChange, className = '' }: ToggleGroupProps) {
  return (
    <div className={`inline-flex bg-bg-elevated rounded-full p-1 ${className}`}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              isSelected
                ? 'bg-bg-card text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
