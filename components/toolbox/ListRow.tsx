'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink } from 'lucide-react';

export type ListRowProps = {
  href: string;
  onClick?: () => void;
  rank?: number;
  iconUrl?: string | null;
  iconRound?: boolean;
  title: string;
  subtitle?: string;
  meta?: string;
  stat?: string;
  trailing?: ReactNode;
  sponsored?: boolean; // 광고(스폰서) 행 — '광고' 라벨 + 하이라이트, 사실 랭킹과 분리
};

export default function ListRow({
  href, onClick, rank, iconUrl, iconRound, title, subtitle, meta, stat, trailing, sponsored,
}: ListRowProps) {
  const t = useTranslations('Feed');
  const hasMeta = meta !== undefined;
  const cls =
    `group flex cursor-pointer items-center gap-3 border-b border-unjong-border px-2 py-2.5 transition-colors last:border-b-0 hover:bg-unjong-background${
      sponsored ? ' bg-unjong-accent/[0.06] ring-1 ring-inset ring-unjong-accent/25' : ''
    }`;

  const inner = (
    <>
      {sponsored ? (
        <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">{t('ad')}</span>
      ) : rank !== undefined ? (
        <span className={`w-6 shrink-0 text-center text-sm font-bold ${rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>
          {rank}
        </span>
      ) : null}
      {iconUrl !== undefined &&
        (iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            width={24}
            height={24}
            className={`h-6 w-6 shrink-0 ${iconRound ? 'rounded-full' : 'rounded'}`}
            onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
          />
        ) : (
          <span className={`h-6 w-6 shrink-0 ${iconRound ? 'rounded-full' : 'rounded'} bg-unjong-background`} />
        ))}
      <div className={`flex flex-col ${hasMeta ? 'w-44 shrink-0 sm:w-52' : 'min-w-0 flex-1'}`}>
        <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{title}</span>
        {subtitle ? <span className="truncate text-xs text-unjong-muted">{subtitle}</span> : null}
      </div>
      {hasMeta && (
        <p className="hidden min-w-0 flex-1 truncate text-sm text-unjong-muted sm:block">{meta}</p>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-2.5">
        {stat ? <span className="shrink-0 text-xs font-bold text-unjong-accent">{stat}</span> : null}
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
        <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-unjong-muted group-hover:text-unjong-accent">
          {t('goto')} <ExternalLink size={12} />
        </span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className={cls}>
        {inner}
      </div>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  );
}
