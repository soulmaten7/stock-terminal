<!-- 2026-06-20 -->
# STEP 317 — [신고 모더레이션 ②-b] 마이페이지 '내 신고' + 본인 철회

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_317_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 316(`5ba60cc`).

---

## 🎯 목표

신고 작성자가 **마이페이지 → '내 신고'**에서 본인 신고를 보고 **철회(삭제)**.
- `GET /api/reports` = 내 신고 목록 / `DELETE /api/reports` = 본인 신고 철회(소유자 확인)
- 단, **'확인됨(confirmed)' 신고는 철회 불가**(관리자가 검증한 공개 기록이라). 대기·기각만 철회.

> 변경 2파일: `app/api/reports/route.ts` 전체교체(POST 유지 + GET·DELETE 추가) · `app/mypage/page.tsx` 6곳.

---

## 📄 파일 1 (전체 교체) — `app/api/reports/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS = ["허위·과장 수익률", "환불 거부", "미등록·사칭 의심", "리딩방 먹튀(잠적)", "불법 추천·미신고 자문", "기타"];

export async function POST(req: NextRequest) {
  let body: { target_type?: string; target_id?: string; target_name?: string; reason?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const target_name = String(body.target_name ?? "").trim().slice(0, 200);
  const reason = String(body.reason ?? "").trim();
  const content = String(body.content ?? "").trim().slice(0, 2000);
  const target_id = String(body.target_id ?? "").trim().slice(0, 100) || null;
  const target_type = String(body.target_type ?? "fss_advisor").trim().slice(0, 40);

  if (!target_name || !REASONS.includes(reason)) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = createAdminClient();

  if (target_id) {
    const { data: dups } = await admin
      .from("room_reports")
      .select("id")
      .eq("reporter_user_id", user.id)
      .eq("target_id", target_id)
      .eq("status", "pending")
      .limit(1);
    if (dups && dups.length) {
      return NextResponse.json({ error: "이미 접수된 신고가 있어요 (검토 중)" }, { status: 409 });
    }
  }

  const { error } = await admin.from("room_reports").insert({
    target_type,
    target_id,
    target_name,
    reason,
    content: content || null,
    reporter_user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// 내 신고 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ reports: [] });
  const admin = createAdminClient();
  const { data } = await admin
    .from("room_reports")
    .select("id, target_name, reason, status, created_at")
    .eq("reporter_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ reports: data ?? [] });
}

// 본인 신고 철회 (확인된 신고는 불가)
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { id?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { data: rep } = await admin.from("room_reports").select("reporter_user_id, status").eq("id", id).single();
  if (!rep || rep.reporter_user_id !== user.id) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  if (rep.status === "confirmed") return NextResponse.json({ error: "확인된 신고는 철회할 수 없습니다" }, { status: 409 });

  const { error } = await admin.from("room_reports").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 파일 2 (수정 6곳) — `app/mypage/page.tsx`

### M1 — import + 타입

**찾기:**
```tsx
import { User, CreditCard, Star, Bell, MessageCircle, Trash2 } from 'lucide-react';
import type { Payment } from '@/types/api';
import type { Watchlist } from '@/types/user';

type Tab = 'profile' | 'subscription' | 'watchlist' | 'notifications' | 'chat';
```
**바꾸기:**
```tsx
import { User, CreditCard, Star, Bell, MessageCircle, Trash2, Siren } from 'lucide-react';
import type { Payment } from '@/types/api';
import type { Watchlist } from '@/types/user';

type Tab = 'profile' | 'subscription' | 'watchlist' | 'notifications' | 'chat' | 'reports';
type MyReport = { id: number; target_name: string; reason: string; status: string; created_at: string };
```

### M2 — state 추가

**찾기:**
```tsx
  const [payments, setPayments] = useState<Payment[]>([]);
  const [nickname, setNickname] = useState('');
```
**바꾸기:**
```tsx
  const [payments, setPayments] = useState<Payment[]>([]);
  const [myReports, setMyReports] = useState<MyReport[]>([]);
  const [nickname, setNickname] = useState('');
```

### M3 — loadData에 신고 불러오기 + 철회 함수

**찾기:**
```tsx
    if (watchlistRes.data) setWatchlistItems(watchlistRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
  };
```
**바꾸기:**
```tsx
    if (watchlistRes.data) setWatchlistItems(watchlistRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);

    try {
      const repRes = await fetch('/api/reports').then((r) => r.json());
      setMyReports(repRes.reports ?? []);
    } catch { /* ignore */ }
  };

  const withdrawReport = async (id: number) => {
    const res = await fetch('/api/reports', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMyReports((prev) => prev.filter((r) => r.id !== id));
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? '철회 실패');
    }
  };
```

### M4 — 탭 추가

**찾기:**
```tsx
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
  ];
```
**바꾸기:**
```tsx
    { key: 'chat', label: '채팅 관리', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'reports', label: '내 신고', icon: <Siren className="w-4 h-4" /> },
  ];
```

### M5 — '내 신고' 내용 블록 (채팅 블록 뒤에 추가)

**찾기:**
```tsx
          {activeTab === 'chat' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">채팅 관리</h2>
              <p className="text-text-secondary text-sm">채팅 기록 및 제재 이력 확인은 준비 중입니다.</p>
            </div>
          )}
```
**바꾸기:**
```tsx
          {activeTab === 'chat' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-bold">채팅 관리</h2>
              <p className="text-text-secondary text-sm">채팅 기록 및 제재 이력 확인은 준비 중입니다.</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-dark-700 rounded-xl border border-border p-6">
              <h2 className="font-bold mb-4">내 신고</h2>
              {myReports.length === 0 ? (
                <p className="text-text-secondary text-sm">접수한 신고가 없습니다.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="text-text-secondary text-sm"><th className="text-left pb-2">대상</th><th className="text-left pb-2">사유</th><th className="text-left pb-2">상태</th><th className="text-left pb-2">접수일</th><th className="text-right pb-2">철회</th></tr></thead>
                  <tbody>
                    {myReports.map((r) => (
                      <tr key={r.id} className="border-t border-border/50">
                        <td className="py-2">{r.target_name}</td>
                        <td className="py-2">{r.reason}</td>
                        <td className="py-2">{r.status === 'confirmed' ? '확인됨' : r.status === 'dismissed' ? '기각됨' : '대기'}</td>
                        <td className="py-2 text-text-secondary">{formatDate(r.created_at)}</td>
                        <td className="py-2 text-right">
                          {r.status === 'confirmed' ? (
                            <span className="text-text-secondary text-xs">—</span>
                          ) : (
                            <button onClick={() => withdrawReport(r.id)} title="철회" className="text-up hover:text-up/80"><Trash2 className="w-4 h-4 inline" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`):
1. 로그인 → 리딩방에서 아무 곳이나 **신고** 1건.
2. **마이페이지 → '내 신고'** 탭 → 방금 신고가 '대기' 상태로 보임.
3. **철회(🗑)** 클릭 → 목록에서 사라짐 (DB에서 삭제).
4. (관리자가 '확인'한 신고는 '확인됨'으로 뜨고 철회 버튼 대신 '—').

> 참고: STEP 315 이전에 만든 옛 테스트 신고는 작성자 기록(reporter_user_id)이 없어 '내 신고'에 안 보임 — 정상.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(report): 마이페이지 '내 신고' + 본인 철회(확인된 신고 제외) (STEP 317)" && git push
```

---

> **한 줄 요약**: 마이페이지 '내 신고' 탭에서 본인 신고 조회·철회(확인된 건 제외). 신고 모더레이션 ②(a·b·c) 완성.
