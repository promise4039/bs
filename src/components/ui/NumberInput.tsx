import { type ChangeEvent } from 'react';

export interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  suffix,
  placeholder,
  className = '',
}: NumberInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw === '' ? 0 : parseInt(raw, 10));
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={value === 0 ? '' : value.toLocaleString('ko-KR')}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-bg-input border border-border-primary rounded-[12px] px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors pr-10"
      />
      {suffix && (
        <span className="absolute right-4 text-text-secondary pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
