import { type ReactNode } from "react";

type StateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function LoadingState({ title = "로딩 중...", description, action, className = "" }: Partial<StateProps>) {
  return (
    <div className={`text-center text-xs text-unjong-muted italic py-4 ${className}`}>
      <p>⏳ {title}</p>
      {description && <p className="mt-1 text-[10px]">{description}</p>}
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className = "" }: StateProps) {
  return (
    <div className={`text-center py-6 ${className}`}>
      {icon && <div className="text-3xl mb-2 opacity-50">{icon}</div>}
      <p className="text-xs text-unjong-primary mb-1">{title}</p>
      {description && <p className="text-[10px] text-unjong-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, action, className = "" }: StateProps) {
  return (
    <div className={`text-center py-4 ${className}`}>
      <p className="text-xs text-unjong-danger mb-1">❌ {title}</p>
      {description && <p className="text-[10px] text-unjong-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
