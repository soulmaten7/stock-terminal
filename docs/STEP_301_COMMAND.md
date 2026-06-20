<!-- 2026-06-20 -->
# STEP 301 — [V7 ④-10] 자가등록 ① 등록 폼 + 저장 + FSS 자동대조

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_301_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 300 + 세션 종료 문서 커밋. 빌드 ✓.
- **사전 작업(완료, DB 직접)**: `room_submissions` 테이블 생성 끝(RLS: 공개행 읽기 정책, 쓰기는 서버 라우트만).

---

## 🎯 목표

리딩방·검증 탭에 **"+ 내 리딩방 등록"** 버튼 → 폼(이름·플랫폼·링크·업체명·사업자번호·소개) → **로그인 필수** 제출 → `room_submissions` 저장 + **사업자번호(없으면 업체명)를 금감원 명부와 자동 대조**(나중 ✅용, 지금 표시 X).
- 즉시 공개·**배지 없음**(미등록 낙인 X). ✅금감원등록확인은 본인확인 후.
- **표시(디렉토리 합류)는 STEP 302** — 이번 STEP은 입력·저장까지. 접수 확인은 DB에서(내가).

> 파일 3개: 제출 API 신규 + RoomSubmitModal 신규 + AdvisorDirectory 4곳 수정.

---

## 📄 파일 1 (신규) — `app/api/rooms/submit/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORMS = ["telegram", "kakao", "naver", "etc"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { room_name?: string; platform?: string; homepage?: string; company_name?: string; biz_no?: string; intro?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const room_name = String(body.room_name ?? "").trim().slice(0, 100);
  const homepage = String(body.homepage ?? "").trim().slice(0, 300);
  const platform = PLATFORMS.includes(String(body.platform)) ? String(body.platform) : "etc";
  const company_name = String(body.company_name ?? "").trim().slice(0, 100) || null;
  const intro = String(body.intro ?? "").trim().slice(0, 200) || null;
  const bizDigits = String(body.biz_no ?? "").replace(/\D/g, "").slice(0, 10);
  const biz_no = bizDigits || null;

  if (!room_name || !/^https?:\/\//.test(homepage)) {
    return NextResponse.json({ error: "리딩방 이름과 올바른 링크(http로 시작)가 필요합니다." }, { status: 400 });
  }

  const admin = createAdminClient();

  // FSS 자동대조: 사업자번호(10자리) 우선, 없으면 업체명 부분일치
  let fss_matched = false;
  let fss_biz_no: string | null = null;
  if (bizDigits.length === 10) {
    const { data } = await admin.from("fss_advisors").select("biz_no").eq("biz_no", bizDigits).maybeSingle();
    if (data) { fss_matched = true; fss_biz_no = data.biz_no; }
  } else if (company_name) {
    const q = company_name.replace(/[%,()]/g, "");
    const { data } = await admin.from("fss_advisors").select("biz_no").ilike("company_name", `%${q}%`).limit(1);
    if (data && data.length) { fss_matched = true; fss_biz_no = data[0].biz_no; }
  }

  const { error } = await admin.from("room_submissions").insert({
    room_name, company_name, biz_no, platform, homepage, intro,
    user_id: user.id, fss_matched, fss_biz_no, status: "public",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fss_matched });
}
```

---

## 📄 파일 2 (신규) — `components/toolbox/RoomSubmitModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const PLATFORMS = [['telegram', '텔레그램'], ['kakao', '카카오톡'], ['naver', '네이버'], ['etc', '기타']] as const;
const inputCls = 'w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent';

export default function RoomSubmitModal({ onClose }: { onClose: (submitted: boolean) => void }) {
  const [roomName, setRoomName] = useState('');
  const [platform, setPlatform] = useState('telegram');
  const [homepage, setHomepage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bizNo, setBizNo] = useState('');
  const [intro, setIntro] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!roomName.trim() || !/^https?:\/\//.test(homepage.trim())) {
      setError('리딩방 이름과 링크(http로 시작)를 확인해주세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/rooms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_name: roomName, platform, homepage, company_name: companyName, biz_no: bizNo, intro }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'login_required' ? '로그인이 필요합니다.' : (j.error ?? '제출 실패'));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-sm font-bold text-unjong-primary">내 리딩방 등록</h3>
          <button type="button" onClick={() => onClose(false)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-unjong-primary">등록이 접수되었습니다.</p>
            <p className="mt-1 text-xs leading-relaxed text-unjong-muted">목록에 표시됩니다. (금감원 등록 확인 배지는 본인확인 도입 후 부여)</p>
            <button type="button" onClick={() => onClose(true)} className="mt-4 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white">닫기</button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">리딩방 이름 *</span>
              <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="예: 신혼테크" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">플랫폼</span>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls}>
                {PLATFORMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">링크(입장 URL) *</span>
              <input value={homepage} onChange={(e) => setHomepage(e.target.value)} placeholder="https://t.me/..." className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">운영 업체명 (선택)</span>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">사업자등록번호 (선택)</span>
              <input value={bizNo} onChange={(e) => setBizNo(e.target.value)} placeholder="10자리 숫자" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-unjong-muted">한줄소개 (선택)</span>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
            </label>

            <p className="text-[11px] leading-relaxed text-unjong-muted">
              제출 시 입력한 사업자번호·업체명을 금감원 신고 명부와 자동 대조합니다. 허위 등록은 신고될 수 있습니다.
            </p>
            {error ? <p className="text-xs text-red-500">{error}</p> : null}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => onClose(false)} className="flex-1 rounded-lg border border-unjong-border py-2 text-sm font-medium text-unjong-muted hover:bg-unjong-background">취소</button>
              <button type="button" onClick={submit} disabled={submitting} className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? '제출 중…' : '등록하기'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📄 파일 3 — `components/toolbox/AdvisorDirectory.tsx` (4곳)

### (3-A) import 추가
**찾기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart, Globe } from 'lucide-react';
```
**바꾸기:**
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Heart, Globe } from 'lucide-react';
import RoomSubmitModal from './RoomSubmitModal';
```

### (3-B) 상태 추가
**찾기:**
```tsx
  const [loginNotice, setLoginNotice] = useState(false);
```
**바꾸기:**
```tsx
  const [loginNotice, setLoginNotice] = useState(false);
  const [registering, setRegistering] = useState(false);
```

### (3-C) "+ 내 리딩방 등록" 버튼 (플랫폼 탭 위)
**찾기:**
```tsx
      {/* 플랫폼 탭(왼쪽) + 정렬 탭(오른쪽) */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
```
**바꾸기:**
```tsx
      {/* 내 리딩방 등록 */}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
          className="rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
        >
          + 내 리딩방 등록
        </button>
      </div>

      {/* 플랫폼 탭(왼쪽) + 정렬 탭(오른쪽) */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
```

### (3-D) 등록 모달 렌더 (맨 끝 `</section>` 직전)
**찾기:**
```tsx
      ) : null}
    </section>
  );
}
```
**바꾸기:**
```tsx
      ) : null}

      {/* 내 리딩방 등록 모달 */}
      {registering ? <RoomSubmitModal onClose={() => setRegistering(false)} /> : null}
    </section>
  );
}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 리딩방·검증 탭 → 면책 밑 우측에 **"+ 내 리딩방 등록"** 버튼.
2. **비로그인** 클릭 → amber 로그인 안내.
3. **로그인** 클릭 → 폼 모달 → 이름·링크 넣고 등록 → "등록이 접수되었습니다".
4. 사유 없는 필드는 비워도 제출됨(이름·링크만 필수).

> 접수 확인은 내가 Supabase `room_submissions`에서 직접 조회해줄게(테스트 후 알려줘). **목록 표시는 STEP 302.**

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 자가등록 폼+저장+FSS 자동대조 (room_submissions, /api/rooms/submit) (V7 ④-10, STEP 301)" && git push
```

---

> **한 줄 요약**: 운영자가 "+ 내 리딩방 등록"으로 직접 등록(로그인 필수) → room_submissions 저장 + 사업자번호·업체명 FSS 자동대조. 디렉토리 합류는 STEP 302.
