import type { ReactNode } from "react";

type CardContainerProps = {
  title: string;
  emoji?: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
};

export function CardContainer({
  title,
  emoji,
  subtitle,
  hint,
  children,
}: CardContainerProps) {
  return (
    <section className="flex flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
      {/* 헤더 */}
      <header className="flex items-center justify-between gap-2 border-b border-unjong-border px-4 py-3 bg-unjong-background">
        <div className="flex items-center gap-1.5 min-w-0">
          {emoji && <span aria-hidden>{emoji}</span>}
          <h3 className="text-sm font-semibold text-unjong-primary truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="text-[10px] text-unjong-muted">· {subtitle}</span>
          )}
        </div>
      </header>

      {/* 바디 */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">{children}</div>

      {/* 힌트 푸터 */}
      {hint && (
        <footer className="border-t border-unjong-border px-3 py-1.5 bg-unjong-background">
          <span className="text-[10px] text-unjong-muted italic">{hint}</span>
        </footer>
      )}
    </section>
  );
}
