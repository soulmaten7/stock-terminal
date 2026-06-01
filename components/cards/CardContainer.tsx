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
      className="flex flex-col bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft hover:shadow-soft-hover transition-shadow duration-200 overflow-hidden scroll-mt-32"
    >
      {/* 헤더 — 큰 폰트·여유 padding */}
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-unjong-border bg-unjong-background/30">
        <div className="flex items-center gap-2 min-w-0">
          {emoji && <span aria-hidden className="text-lg">{emoji}</span>}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-unjong-primary truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-unjong-muted truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-0.5 text-xs text-unjong-muted hover:text-unjong-accent transition-colors flex-shrink-0 font-medium"
            aria-label={`${title} 상세`}
          >
            <span>더보기</span>
            <ArrowUpRight size={12} />
          </Link>
        )}
      </header>

      {/* 바디 — 큰 padding */}
      <div className="flex-1 overflow-y-auto p-5 min-h-0">{children}</div>

      {/* 힌트 */}
      {hint && (
        <footer className="border-t border-unjong-border px-5 py-2 bg-unjong-background/20">
          <span className="text-xs text-unjong-muted italic">{hint}</span>
        </footer>
      )}
    </section>
  );
}
