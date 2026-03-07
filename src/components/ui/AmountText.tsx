import { formatKRW } from '../../utils/currency';

export interface AmountTextProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
  className?: string;
}

const typeStyles: Record<NonNullable<AmountTextProps['type']>, string> = {
  income: 'text-income',
  expense: 'text-expense',
  neutral: 'text-text-primary',
};

const sizeStyles: Record<NonNullable<AmountTextProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-bold',
  xl: 'text-2xl font-bold',
};

export function AmountText({
  amount,
  type = 'neutral',
  size = 'md',
  showSign = false,
  className = '',
}: AmountTextProps) {
  const absFormatted = formatKRW(Math.abs(amount));
  const sign = showSign ? (amount >= 0 ? '+' : '-') : '';

  return (
    <span className={`${typeStyles[type]} ${sizeStyles[size]} ${className}`}>
      {sign}{absFormatted}
    </span>
  );
}
