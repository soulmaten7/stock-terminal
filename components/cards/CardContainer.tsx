import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type CardContainerProps = {
  id?: string;
  title: string;
  emoji?: string;
  subtitle?: string;
  hint?: string;
  detailHref?: string;
  children: ReactNode;
};

export function CardContainer({
  id,
  title,
  emoji,
  subtitle,
  hint,
  detailHref,
  children,
}: CardContainerProps) {
  return (
    <section
      id={id}
      className="flex flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden scroll-mt-32"
    >
      {/* 헤더 */}
      <header className="flex items-center justify-between gap-2 border-b border-unjong-border px-4 py-3 bg-unjong-background">
        <div className="flex items-center gap-1.5 min-w-0">
          {emoji && <span aria-hidden>{emoji}</span>}
          <h3 className="text-sm font-semibold text-unjong-primary truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs text-unjong-muted">· {subtitle}</span>
          )}
        </div>

        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-0.5 text-xs text-unjong-muted hover:text-unjong-accent transition-colors flex-shrink-0"
            aria-label={`${title} 상세 페이지`}
          >
            <span>더보기</span>
            <ArrowUpRight size={11} />
          </Link>
        )}
      </header>

      {/* 바디 */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">{children}</div>

      {/* 힌트 푸터 */}
      {hint && (
        <footer className="border-t border-unjong-border px-3 py-1.5 bg-unjong-background">
          <span className="text-xs text-unjong-muted italic">{hint}</span>
        </footer>
      )}
    </section>
  );
}
