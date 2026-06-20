<!-- 2026-06-20 -->
# STEP 315 — [신고 모더레이션 ②-a] 신고 로그인 필수 + 작성자 기록 + 검토 후 공개

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_315_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 314(`941aaa9`).
- **DB는 이미 완료(Cowork가 처리)**: ① `advisor_directory` 뷰 = homepage 없는 행 제외(264개) + ② 공개 report_count = `status='confirmed'`만 카운트. 이 STEP은 **코드 2파일만**.

---

## 🎯 목표

신고 악용(익명 도배) 차단:
- 신고하려면 **로그인 필수**, 신고에 **작성자(reporter_user_id) 기록** → 나중에 본인 철회 가능(②-b)
- 신고는 **'대기(pending)'로 접수** → 관리자 확인(②-c) 전엔 공개 🚨 카운트에 **안 잡힘** (뷰는 이미 confirmed만 셈)
- 같은 대상에 대기 중 신고 중복 방지

> 변경 2파일: `app/api/reports/route.ts` 전체교체 · `components/toolbox/AdvisorDirectory.tsx` 4곳 수정.

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

  // 로그인 필수 — 작성자 기록(악의적 익명 도배 방지 + 본인 철회 가능)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const admin = createAdminClient();

  // 중복 방지: 같은 사용자가 같은 대상에 대기 중 신고가 이미 있으면 막음
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
    // status 는 DB 기본값 'pending'
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 파일 2 (수정 4곳) — `components/toolbox/AdvisorDirectory.tsx`

### 수정 2-1 — 신고 모달 열기 전 로그인 게이트

**찾기:**
```tsx
  function openReport(a: Advisor) {
    setReporting(a); setReportReason(''); setReportContent(''); setReportDone(false); setReportError('');
  }
```
**바꾸기:**
```tsx
  function openReport(a: Advisor) {
    if (!isLoggedIn) { setLoginNotice(true); return; }
    setReporting(a); setReportReason(''); setReportContent(''); setReportDone(false); setReportError('');
  }
```

### 수정 2-2 — 낙관적 신고 카운트 증가 제거 (대기 상태라 공개 반영 안 됨)

**찾기:**
```tsx
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      const id = reporting.biz_no;
      setResults((prev) => prev.map((x) => x.biz_no === id ? { ...x, report_count: x.report_count + 1 } : x));
      setSelected((s) => (s && s.biz_no === id ? { ...s, report_count: s.report_count + 1 } : s));
      setReportDone(true);
```
**바꾸기:**
```tsx
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      // 신고는 '대기'로 접수 — 관리자 확인 후에만 공개 카운트 반영(낙관적 증가 제거)
      setReportDone(true);
```

### 수정 2-3 — 로그인 안내 문구 일반화(좋아요·신고 공용)

**찾기:**
```tsx
          <span>좋아요는 로그인 후 이용할 수 있어요.</span>
```
**바꾸기:**
```tsx
          <span>로그인 후 이용할 수 있어요.</span>
```

### 수정 2-4 — 신고 모달 안내문(검토 후 공개 명시 + '추후 적용' 문구 제거)

**찾기:**
```tsx
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">허위 신고는 무고가 될 수 있습니다. 사실에 근거해 작성해주세요. (로그인·본인확인은 추후 적용 예정)</p>
```
**바꾸기:**
```tsx
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">신고는 접수 후 관리자 검토를 거쳐 공개에 반영됩니다. 허위 신고는 무고가 될 수 있으니 사실에 근거해 작성해주세요.</p>
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`):
1. **로그아웃 상태**에서 리딩방 행의 🚨(신고) 클릭 → 모달 안 뜨고 "로그인 후 이용할 수 있어요" 안내 + 로그인 링크.
2. **로그인 후** 신고 → "신고가 접수되었습니다. 관리자 검토 후 공개에 반영됩니다." → **🚨 공개 숫자는 안 올라감**(정상, 대기 상태).
3. 같은 대상 또 신고 → "이미 접수된 신고가 있어요 (검토 중)".
4. (관리자) `/admin` → 신고 표에 새 행 `status=pending`으로 보임.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(report): 신고 로그인 필수+작성자 기록+중복 방지, 대기 상태 접수(검토 후 공개) (STEP 315)" && git push
```

---

> **한 줄 요약**: 신고를 로그인 필수·작성자 기록·대기 접수로 바꿔 익명 도배 차단. 공개 🚨는 관리자 확인분만(뷰 이미 적용). 다음 ②-b(본인 철회)·②-c(관리자 확인).
