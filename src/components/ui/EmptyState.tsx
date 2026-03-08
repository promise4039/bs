import { Button } from './Button';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {icon && (
        <div className="text-5xl mb-5 opacity-80">{icon}</div>
      )}
      <h3 className="text-[16px] font-semibold text-text-primary mb-1.5 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-text-secondary mb-6 text-center leading-relaxed max-w-[260px]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
