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
  /** 컴팩트 사이즈 (설정 등 좁은 영역) */
  compact?: boolean;
}

export function ToggleGroup({ options, selected, onChange, className = '', compact = false }: ToggleGroupProps) {
  return (
    <div className={`inline-flex bg-bg-elevated rounded-full p-1 ${className}`}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full font-medium transition-all ${
              compact
                ? 'px-4 py-1.5 text-sm'
                : 'px-5 py-2 text-[15px]'
            } ${
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
