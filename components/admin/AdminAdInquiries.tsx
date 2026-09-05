'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

type Inquiry = { id: number; slot: string | null; company: string; contact_name: string | null; email: string | null; phone: string | null; message: string | null; status: string; created_at: string };

const SLOT_LABEL: Record<string, string> = { broker: '증권사', other: '기타' };
const STATUS: { key: string; label: string }[] = [
  { key: 'new', label: '신규' },
  { key: 'contacted', label: '연락함' },
  { key: 'closed', label: '종료' },
];

const CONTACT = 'contact@onetrillion.app';
// 광고 위치별 기본 회신 템플릿 — '연락함' 클릭 시 메일 본문에 채워짐
const TEMPLATES: Record<string, { subject: string; body: (company: string) => string }> = {
  broker: {
    subject: '[어스티커] 증권사 광고 문의 회신',
    body: (c) => `안녕하세요, ${c} 담당자님.\n어스티커 광고 문의 주셔서 감사합니다.\n\n문의하신 '증권사 슬롯'은 종목·상품 탭의 증권사 리스트 상단/중간에 노출됩니다. 주식 정보를 찾는 사용자에게 계좌개설·이벤트를 노출할 수 있습니다.\n\n노출 위치·기간·단가는 협의 후 안내드리겠습니다. 희망 조건을 회신해 주세요.\n\n감사합니다.\n어스티커 드림\n${CONTACT}`,
  },
  other: {
    subject: '[어스티커] 광고 문의 회신',
    body: (c) => `안녕하세요, ${c} 담당자님.\n어스티커에 문의 주셔서 감사합니다.\n\n문의 내용 확인했습니다. 자세한 안내를 위해 희망 사항을 회신해 주세요.\n\n감사합니다.\n어스티커 드림\n${CONTACT}`,
  },
};

function mailtoFor(q: Inquiry): string {
  const t = TEMPLATES[q.slot ?? 'other'] ?? TEMPLATES.other;
  return `mailto:${q.email ?? ''}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body(q.company))}`;
}

export default function AdminAdInquiries({ initial }: { initial: Inquiry[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      const res = await fetch('/api/admin/ad-inquiries', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(prev);
    } finally {
      setBusy(null);
    }
  }

  // '연락함' 클릭 = 위치별 템플릿 메일 작성창 열기 + 상태=연락함
  function onStatusClick(q: Inquiry, key: string) {
    if (key === 'contacted' && q.email) window.location.href = mailtoFor(q);
    setStatus(q.id, key);
  }

  if (!rows.length) return <p className="py-8 text-center text-sm text-unjong-muted">접수된 광고 문의가 없습니다.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-unjong-border text-xs text-unjong-muted">
          <tr>
            <th className="py-2 pr-3">회사</th>
            <th className="py-2 pr-3">위치</th>
            <th className="py-2 pr-3">담당자</th>
            <th className="py-2 pr-3">연락처</th>
            <th className="py-2 pr-3">메시지</th>
            <th className="py-2 pr-3">상태</th>
            <th className="py-2">접수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id} className="border-b border-unjong-border align-top">
              <td className="py-2 pr-3 font-medium text-unjong-primary">{q.company}</td>
              <td className="py-2 pr-3 text-unjong-muted">{q.slot ? (SLOT_LABEL[q.slot] ?? q.slot) : '—'}</td>
              <td className="py-2 pr-3 text-unjong-muted">{q.contact_name || '—'}</td>
              <td className="py-2 pr-3 text-unjong-muted">
                {q.email ? <div>{q.email}</div> : null}
                {q.phone ? <div>{q.phone}</div> : null}
                {!q.email && !q.phone ? '—' : null}
              </td>
              <td className="max-w-[16rem] whitespace-pre-wrap py-2 pr-3 text-unjong-primary">{q.message || '—'}</td>
              <td className="py-2 pr-3">
                <div className="flex gap-1">
                  {STATUS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={busy === q.id}
                      onClick={() => onStatusClick(q, s.key)}
                      title={s.key === 'contacted' ? '메일 작성 열기 + 연락함 표시' : undefined}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors disabled:opacity-50 ${
                        q.status === s.key ? 'bg-unjong-accent text-white' : 'border border-unjong-border text-unjong-muted hover:text-unjong-primary'
                      }`}
                    >
                      {s.key === 'contacted' ? <Mail size={11} /> : null}
                      {s.label}
                    </button>
                  ))}
                </div>
              </td>
              <td className="py-2 text-xs text-unjong-muted">{new Date(q.created_at).toLocaleDateString('ko-KR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
