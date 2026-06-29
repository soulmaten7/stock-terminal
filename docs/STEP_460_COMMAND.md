<!-- 2026-06-28 -->
# STEP 460 — 광고문의 이메일+전화 필수 + 관리자 '연락함' = 템플릿 메일 작성

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_460_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. `/advertise` 문의: **이메일 + 전화번호 둘 다 필수**(폼 + API 검증).
2. 관리자 광고 문의: **"연락함" 클릭 → 위치별 기본 템플릿** 채운 **메일 작성창**(mailto) 열림 + 상태=연락함.
   - mailto = 관리자 기본 메일 앱이 작성창 열기(받는사람=문의자 이메일, 제목·본문 자동). contact@onetrillion.app으로 보내려면 그 계정이 기본 메일로 설정돼 있어야 함. 서버 자동발송은 Phase 2.

## 전제
- 최신 main(STEP 458·459). 파일 3개, 전부 클라이언트/라우트 → **HMR**(재시작 불필요).

---

## (1) `components/advertise/AdInquiryForm.tsx` — 2곳

**1-A) 검증: 이메일+전화 둘 다 필수** — 찾기:
```tsx
    if (!company.trim()) { setError('회사명을 입력해 주세요'); return; }
    if (!email.trim() && !phone.trim()) { setError('이메일 또는 연락처 중 하나는 입력해 주세요'); return; }
```
바꾸기:
```tsx
    if (!company.trim()) { setError('회사명을 입력해 주세요'); return; }
    if (!email.trim()) { setError('이메일을 입력해 주세요'); return; }
    if (!phone.trim()) { setError('연락처를 입력해 주세요'); return; }
```

**1-B) 라벨에 * 표시** — 찾기:
```tsx
      <Field label="이메일" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
      <Field label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" />
```
바꾸기:
```tsx
      <Field label="이메일 *" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
      <Field label="연락처 *" value={phone} onChange={setPhone} placeholder="010-0000-0000" />
```

---

## (2) `app/api/advertise/inquiry/route.ts` — 검증 둘 다 필수
찾기:
```ts
  if (!company) return NextResponse.json({ error: "회사명을 입력해 주세요" }, { status: 400 });
  if (!email && !phone) return NextResponse.json({ error: "이메일 또는 연락처 중 하나는 입력해 주세요" }, { status: 400 });
```
바꾸기:
```ts
  if (!company) return NextResponse.json({ error: "회사명을 입력해 주세요" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "이메일을 입력해 주세요" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "연락처를 입력해 주세요" }, { status: 400 });
```

---

## (3) `components/admin/AdminAdInquiries.tsx` — 전체 교체 (템플릿 + 연락함 메일)
```tsx
'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

type Inquiry = { id: number; slot: string | null; company: string; contact_name: string | null; email: string | null; phone: string | null; message: string | null; status: string; created_at: string };

const SLOT_LABEL: Record<string, string> = { broker: '증권사', room: '리딩방', other: '기타' };
const STATUS: { key: string; label: string }[] = [
  { key: 'new', label: '신규' },
  { key: 'contacted', label: '연락함' },
  { key: 'closed', label: '종료' },
];

const CONTACT = 'contact@onetrillion.app';
// 광고 위치별 기본 회신 템플릿 — '연락함' 클릭 시 메일 본문에 채워짐
const TEMPLATES: Record<string, { subject: string; body: (company: string) => string }> = {
  broker: {
    subject: '[트릴리언] 증권사 광고 문의 회신',
    body: (c) => `안녕하세요, ${c} 담당자님.\n트릴리언 광고 문의 주셔서 감사합니다.\n\n문의하신 '증권사 슬롯'은 종목·상품 탭의 증권사 리스트 상단/중간에 노출됩니다. 주식 정보를 찾는 사용자에게 계좌개설·이벤트를 노출할 수 있습니다.\n\n노출 위치·기간·단가는 협의 후 안내드리겠습니다. 희망 조건을 회신해 주세요.\n\n감사합니다.\n트릴리언 드림\n${CONTACT}`,
  },
  room: {
    subject: '[트릴리언] 리딩방 게재 문의 회신',
    body: (c) => `안녕하세요, ${c} 담당자님.\n트릴리언 리딩방 게재 문의 주셔서 감사합니다.\n\n리딩방 게재는 '유사투자자문 신고 + 운영자 인증'을 마친 곳만 가능합니다.\n- 인증 업체당 채널 1개: 무료 게재\n- 추가 채널: 1개당 월 5만원\n\n인증 절차와 게재 방법을 안내드리겠습니다. 사업자등록번호와 채널 정보를 회신해 주세요.\n\n※ 게재는 '노출'이며 안전·수익을 보증하지 않습니다.\n\n감사합니다.\n트릴리언 드림\n${CONTACT}`,
  },
  other: {
    subject: '[트릴리언] 광고 문의 회신',
    body: (c) => `안녕하세요, ${c} 담당자님.\n트릴리언에 문의 주셔서 감사합니다.\n\n문의 내용 확인했습니다. 자세한 안내를 위해 희망 사항을 회신해 주세요.\n\n감사합니다.\n트릴리언 드림\n${CONTACT}`,
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
```

---

## 확인 (HMR — 새로고침)
- `/advertise` 폼: 이메일/연락처 비우고 제출 → 각각 "이메일을 입력해 주세요" / "연락처를 입력해 주세요" 막힘. 둘 다 넣어야 제출됨.
- `/admin` 광고 문의 탭: "연락함" 버튼에 ✉ 아이콘. 클릭 → **기본 메일 앱 작성창**(받는사람=문의자 이메일, 제목·본문=위치별 템플릿) 열림 + 상태=연락함.
- 빌드 에러 없음.
- (Cowork이 빌드 확인 후 테스트 문의로 메일 템플릿 검증하고 정리.)

## 빌드·커밋
- 보류. 확인 후 458·459·460 묶어 커밋.
