export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  /** 패딩 크기 조절 (default: 'md') */
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  return (
    <div
      className={`bg-bg-card rounded-[16px] ${paddingStyles[padding]} ${
        onClick
          ? 'hover:bg-bg-card-hover active:bg-bg-card-hover cursor-pointer transition-colors duration-150'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
