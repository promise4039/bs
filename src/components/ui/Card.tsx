export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-bg-card rounded-[16px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.3)] ${
        onClick ? 'hover:bg-bg-card-hover cursor-pointer transition-colors' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
