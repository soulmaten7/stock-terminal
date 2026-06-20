'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

type Advisor = {
  biz_no: string;
  company_name: string;
  representative: string | null;
  valid_from: string | null;
  valid_to: string | null;
  homepage: string | null;
  phone: string | null;
  address: string | null;
};

// 주소 → 시·도 + 시·군·구 (앞 2토큰)
function region(address: string | null): string {
  if (!address) return '';
  return address.split(' ').slice(0, 2).join(' ');
}

export default function AdvisorDirectory() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Advisor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/advisors?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setTotal(j.total ?? 0);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <section className="min-w-0">
      {/* 면책 배너 */}
      <div className="mb-3 rounded-xl border border-unjong-border bg-unjong-background p-3">
        <p className="text-sm font-bold text-unjong-primary">금융감독원 신고 유사투자자문·리딩방 조회</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">
          출처: 금융감독원 금융소비자포털 '파인' (매일 갱신).{' '}
          '신고'는 정부의 안전 보증·인증이 아닙니다. 운종은 어떤 업체의 안전성·수익성도 보증하지 않으며,
          사실(신고 여부·기간·연락처)만 제공합니다. 판단은 이용자 몫이며,{' '}
          <strong className="text-unjong-primary">신고되지 않은 익명 리딩방은 특히 주의</strong>하세요.
        </p>
      </div>

      {/* 검색창 */}
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="업체명 또는 대표자 검색 (예: 귀인마케팅)"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>

      <p className="mb-2 px-1 text-xs text-unjong-muted">
        {q
          ? `'${q}' 검색 결과 ${total.toLocaleString()}건`
          : `전체 ${total.toLocaleString()}개 신고 업체 · 최근 신고순`}
        {!loading && results.length < total ? ` (상위 ${results.length}개 표시)` : ''}
      </p>

      {/* 결과 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
      ) : results.length === 0 ? (
        <p className="py-10 text-center text-sm text-unjong-muted">
          검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.
        </p>
      ) : (
        <ul className="space-y-1">
          {results.map((a) => (
            <li key={a.biz_no} className="rounded-lg border border-unjong-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-unjong-primary">{a.company_name}</p>
                  <p className="mt-0.5 text-xs text-unjong-muted">
                    대표 {a.representative ?? '—'}
                    {region(a.address) ? ` · ${region(a.address)}` : ''}
                  </p>
                </div>
                {a.homepage ? (
                  <a
                    href={a.homepage}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                  >
                    홈페이지 <ExternalLink size={11} />
                  </a>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-unjong-muted">
                <span>신고기간 {a.valid_from ?? '—'} ~ {a.valid_to ?? '—'}</span>
                {a.phone ? <span>☎ {a.phone}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
