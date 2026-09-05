<!-- 2026-06-28 -->
# STEP 451 — /business를 "업체 인증·관리" 허브로 + 마이페이지 탭 제거 + 버튼 라벨

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_451_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
업체 운영자 관리 기능을 **마이페이지에서 떼서 `/business` 한 곳으로 통합.**
1. **`/business` = "업체 인증·관리" 허브** — [내 업체 관리(MyBusinessClient)] + [새 업체 인증(BusinessClaimClient)].
2. **마이페이지 '내 업체' 탭 제거** (소비자용 마이페이지 = 프로필·내 신고만).
3. **디렉토리 버튼 "+ 리딩방 등록" → "리딩방 등록·관리"** (이제 등록+관리 둘 다라).

## 전제
- 최신 main(STEP 450 + acdd27e). 파일 4개. 전부 페이지/클라이언트 컴포넌트 → **HMR/Fast Refresh**(새 라우트 없음). 새로고침 안 되면 재시작.

---

## (1) `app/business/page.tsx` — 전체 교체 (허브)
**아래 내용으로 파일 전체 덮어써:**
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessClaimClient from "@/components/business/BusinessClaimClient";
import MyBusinessClient from "@/components/business/MyBusinessClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "업체 인증·관리 — 트릴리언" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">업체 인증·관리</h1>
      <p className="mb-8 text-sm leading-relaxed text-unjong-muted">
        금감원에 유사투자자문 신고된 업체만 게재할 수 있어요. 본인 업체를 인증하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">내 업체 관리</h2>
        <MyBusinessClient />
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">새 업체 인증</h2>
        <BusinessClaimClient />
      </section>
    </div>
  );
}
```

---

## (2) `components/business/MyBusinessClient.tsx` — 빈 상태 순환링크 제거
(이제 같은 페이지 아래에 인증 폼이 있으니 "/business" 링크는 순환 — 안내문으로 교체)
**찾기:**
```tsx
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요.</p>
        <a href="/business" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">업체 인증하기 →</a>
      </div>
    );
```
**바꾸기:**
```tsx
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 아래 <b className="text-unjong-primary">새 업체 인증</b>에서 본인 업체를 찾아 인증하세요.</p>
      </div>
    );
```

---

## (3) `app/mypage/page.tsx` — '내 업체' 탭 제거 (4곳)

### (3-a) import 정리 (Store·MyBusinessClient 제거)
**찾기:**
```tsx
import { User, Siren, Trash2, Store } from 'lucide-react';
import MyBusinessClient from '@/components/business/MyBusinessClient';
```
**바꾸기:**
```tsx
import { User, Siren, Trash2 } from 'lucide-react';
```

### (3-b) Tab 타입
**찾기:**
```tsx
type Tab = 'profile' | 'reports' | 'business';
```
**바꾸기:**
```tsx
type Tab = 'profile' | 'reports';
```

### (3-c) tabs 배열 — 내 업체 항목 제거
**찾기:**
```tsx
    { key: 'profile', label: '프로필', icon: <User size={16} /> },
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
    { key: 'business', label: '내 업체', icon: <Store size={16} /> },
```
**바꾸기:**
```tsx
    { key: 'profile', label: '프로필', icon: <User size={16} /> },
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
```

### (3-d) 렌더 제거
**찾기:**
```tsx
      )}

      {activeTab === 'business' && <MyBusinessClient />}
    </div>
  );
}
```
**바꾸기:**
```tsx
      )}
    </div>
  );
}
```

---

## (4) `components/toolbox/AdvisorDirectory.tsx` — 버튼 라벨 (2곳 모두)
**찾기 (2번 등장 — 모두 교체):**
```tsx
              + 리딩방 등록
```
> ※ 들여쓰기 다를 수 있으니 텍스트 `+ 리딩방 등록`을 **`리딩방 등록·관리`** 로 전부 교체(모바일·데스크탑 버튼 2곳).

**바꾸기:**
```tsx
              리딩방 등록·관리
```

---

## 확인 (localhost)
- 리딩방·검증 탭 버튼: **"리딩방 등록·관리"** → 클릭 → `/business`.
- **`/business`**: 제목 "업체 인증·관리" → ① **내 업체 관리**(인증된 업체 카드, 없으면 "아래에서 인증하세요") ② **새 업체 인증**(검색→신청).
- **마이페이지**: 탭이 **프로필 · 내 신고** 둘만(내 업체 사라짐).
- 빌드 에러 없음 (mypage에서 Store·MyBusinessClient 참조 제거됨, MyBusinessClient는 /business에서 계속 사용).

## 빌드·커밋
- 보류. 확인 후 단독 커밋.
