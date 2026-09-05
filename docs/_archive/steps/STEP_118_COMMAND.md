<!-- 2026-05-31 -->
# STEP 118 — Layer 3 인증 (카카오 OAuth + DB 통합 + 로그인 UI)

🔴 **Opus 권장** (Auth 인프라 + DB 마이그레이션 + 다중 파일 변경)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `3f9fd82` (STEP 116 V3 청소 1차)
- V3 인증 인프라 일부 존재:
  - `users` 테이블 (id·email·nickname·avatar_url·role·subscription_*·billing_key·created_at·updated_at)
  - `components/auth/AuthProvider.tsx` (Supabase Auth + users 조회)
  - `stores/authStore.ts` (zustand User state)
  - `app/auth/callback/`, `app/auth/login/`, `app/auth/signup/`
- 운종 V5 정책: **인증 선택사항** (비로그인도 채팅·관심종목 가능, 로그인 시 영구화·Tier 시스템)

## 목표

| 항목 | 변경 |
|------|------|
| **DB users 테이블** | V3 결제 컬럼 (subscription_*, billing_key) 제거 + tier 1·2·3 컬럼 추가 |
| **인증 방식** | 카카오 OAuth 만 (이메일/비밀번호 signup 제거) |
| **로그인 페이지** | V3 → V5 운종 디자인으로 재작성 (카카오 버튼 1개만) |
| **signup 페이지** | 통째 삭제 (카카오 OAuth 가 자동 생성) |
| **callback** | 유지 (카카오 OAuth 콜백 처리) |
| **Header User 아이콘** | 로그인 X → /auth/login · 로그인 O → 프로필 드롭다운 |
| **AuthProvider** | 유지 + tier 정보 로드 |
| **NicknameStore** | 로그인 시 DB users.nickname 우선, 비로그인 시 localStorage 폴백 |

## ⚠️ 사용자 (Jang Eun) 직접 작업 필요

다음 2개는 Claude Code 가 할 수 없고 사용자가 직접 해야 함:

### 사용자 작업 1 — 카카오 Developers 콘솔

1. https://developers.kakao.com 접속 → 로그인
2. **내 애플리케이션 → 애플리케이션 추가하기**
   - 앱 이름: `운종`
   - 회사명: (본인 이름 또는 운종)
3. **앱 설정 → 플랫폼 → Web 플랫폼 등록**
   - 사이트 도메인: `http://localhost:3333`, `https://qxkmwlkchyxfzxbonhtj.supabase.co` (배포 후 도메인 추가)
4. **카카오 로그인 → 활성화 설정 ON**
5. **카카오 로그인 → Redirect URI 등록**:
   ```
   https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback
   ```
6. **동의항목 → 닉네임·프로필 사진·이메일** 필수 동의 설정
7. **앱 설정 → 앱 키** 에서 **REST API 키** 복사

### 사용자 작업 2 — Supabase Dashboard

1. https://supabase.com/dashboard/project/qxkmwlkchyxfzxbonhtj/auth/providers 접속
2. **Kakao** 토글 ON
3. 입력:
   - **REST API Key**: 카카오 developer 에서 복사한 키
   - **Client Secret**: (카카오 보안 탭에서 발급한 secret 또는 생략)
   - **Redirect URL** (확인): `https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback`
4. Save

→ 이 2개 완료되면 Claude Code 실행. 안 했어도 코드는 빌드 가능 (런타임에서 카카오 로그인 시도 시 OAuth 안 됨 정도).

---

## 작업 디테일

### [1] DB 마이그레이션 016 — users 테이블 V5 정리

신규 파일: `supabase/migrations/016_users_v5.sql`

```sql
-- 016: users 테이블 V5 정리 (V3 결제 컬럼 제거 + tier 추가)

-- 1) V3 결제 컬럼 제거
ALTER TABLE public.users
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_start_date,
  DROP COLUMN IF EXISTS subscription_end_date,
  DROP COLUMN IF EXISTS billing_key;

-- 2) role 컬럼 → tier 로 변경 (1=일반·2=인증전문가·3=Tier 광고주)
-- role 컬럼 보존 + tier 신규 (양쪽 모두 활용)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 1
    CHECK (tier IN (1, 2, 3));

-- 3) 자기소개 + 가입경로
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- 4) auth.users 자동 동기화 트리거 (카카오 로그인 시 users 행 자동 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  kakao_nickname TEXT;
  kakao_avatar TEXT;
BEGIN
  -- raw_user_meta_data 에서 카카오 정보 추출
  kakao_nickname := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'preferred_username',
    '트레이더-' || substring(NEW.id::text, 1, 4)
  );
  kakao_avatar := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.users (id, email, nickname, avatar_url, role, tier, oauth_provider, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@unjong.local'),
    kakao_nickname,
    kakao_avatar,
    'free',
    1,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 연결 (기존 있으면 교체)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5) RLS — 본인만 자기 user 데이터 수정 가능, 모두 조회 가능 (닉네임 표시용)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users public read" ON public.users;
CREATE POLICY "users public read" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users self update" ON public.users;
CREATE POLICY "users self update" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

⚠️ **이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용** (Claude Code 적용 X).

### [2] /auth/signup 페이지 삭제

```bash
rm -rf app/auth/signup
```

(카카오 OAuth 가 자동 회원 가입 처리)

### [3] /auth/login 페이지 — V5 디자인으로 새로 작성

`app/auth/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-unjong-background p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 */}
        <Link
          href="/kr"
          className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary mb-6"
        >
          <ArrowLeft size={14} />
          돌아가기
        </Link>

        {/* 운종 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider text-unjong-primary mb-2">
            UNJONG <span className="text-base text-unjong-muted font-medium">운종</span>
          </h1>
          <p className="text-xs text-unjong-muted">한국 주식 동선의 출발점</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-unjong-surface rounded-lg border border-unjong-border p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-unjong-primary mb-1">로그인</h2>
            <p className="text-xs text-unjong-muted">
              로그인하면 닉네임과 관심종목이 모든 기기에서 동기화됩니다
            </p>
          </div>

          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#FEE500] text-[#000] font-semibold py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <MessageCircle size={18} />
            {loading ? "이동 중..." : "카카오로 시작하기"}
          </button>

          {error && (
            <p className="text-xs text-unjong-danger text-center">
              ❌ {error}
            </p>
          )}

          <div className="border-t border-unjong-border pt-4 text-center space-y-1">
            <p className="text-[10px] text-unjong-muted">
              로그인 없이도 채팅·관심종목 사용 가능합니다
            </p>
            <p className="text-[10px] text-unjong-muted">
              단 닉네임·관심종목이 이 브라우저에만 저장됩니다
            </p>
          </div>
        </div>

        {/* 약관 */}
        <p className="text-[10px] text-unjong-muted text-center mt-6 leading-relaxed">
          로그인 시 운종의 <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link> 에 동의한 것으로 간주됩니다
        </p>
      </div>
    </div>
  );
}
```

### [4] /auth/callback 확인 + 수정

`app/auth/callback/route.ts` (또는 page.tsx) 가 OAuth 콜백을 처리:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/kr";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }

  return NextResponse.redirect(`${url.origin}/auth/login?error=oauth_failed`);
}
```

(기존 callback 파일이 있으면 V5 구조에 맞게 정리)

### [5] Header.tsx User 아이콘 정리

`components/layout/Header.tsx` 의 User 아이콘 동작:

```tsx
// 이미 useAuthStore 사용 중
// 비로그인 시: <Link href="/auth/login">
// 로그인 시: 프로필 드롭다운

// 정리:
// - signup 링크 제거 (있다면)
// - 프로필 드롭다운 내 V3 잔재 링크 제거 (V3 페이지 삭제됨)
// - "마이페이지" 링크는 /mypage 유지 (Layer 3 에서 활용)
```

기존 코드 확인 후 정리. 핵심:
- 비로그인: User 아이콘 클릭 → `/auth/login`
- 로그인: User 아이콘 → 드롭다운 (이메일, 닉네임, 마이페이지, 로그아웃)
- 모든 V3 잔재 링크 (/stocks, /pricing 등) 제거

### [6] authStore 확장

`stores/authStore.ts`:

```ts
import { create } from 'zustand';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  tier: 1 | 2 | 3;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tier: 1,
  isLoading: true,
  setUser: (user) => set({ user, tier: (user?.tier as 1 | 2 | 3) ?? 1 }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

`types/user.ts` 도 확장:
```ts
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  role: 'free' | 'premium' | 'pro';
  tier: 1 | 2 | 3;
  bio: string | null;
  oauth_provider: string | null;
  created_at: string;
  updated_at: string;
}
```

(V3 결제 필드 (subscription_*, billing_key) 제거)

### [7] AuthProvider 정리

`components/auth/AuthProvider.tsx` 는 기본 구조 유지. 단 V3 잔재 import 정리 + tier 로드 확인.

기존 코드:
```tsx
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', session.user.id)
  .single();
setUser(data);
```

→ 변경 사항 없음 (`.select('*')` 가 tier 포함해 다 가져옴)

### [8] NicknameStore 통합

`stores/nicknameStore.ts` 의 ensureNickname() 을 로그인 우선으로:

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

type Store = {
  nickname: string;
  setNickname: (n: string) => void;
  ensureNickname: () => void;
};

function generateNickname(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `트레이더-${num}`;
}

export const useNickname = create<Store>()(
  persist(
    (set, get) => ({
      nickname: "",
      setNickname: (n) => set({ nickname: n }),
      ensureNickname: () => {
        // 1. 로그인한 사용자면 DB 닉네임 우선
        const authUser = useAuthStore.getState().user;
        if (authUser?.nickname) {
          set({ nickname: authUser.nickname });
          return;
        }
        // 2. 로그인 X 면 localStorage 생성
        if (!get().nickname) {
          set({ nickname: generateNickname() });
        }
      },
    }),
    {
      name: "unjong-nickname",
    }
  )
);
```

### [9] 빌드 검증

```bash
npm run build 2>&1 | tail -30
```

체크:
- TypeScript 에러 0
- /auth/login 라우트 정상
- /auth/signup 라우트 사라짐
- /auth/callback 정상

### [10] 4개 문서 헤더 날짜 갱신 + 로그 기록

### [11] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(auth): Layer 3 인증 — 카카오 OAuth + DB 통합 + 로그인 UI

DB 마이그레이션 016 (Cowork 가 Supabase MCP 로 별도 적용):
- V3 결제 컬럼 제거 (subscription_status, subscription_start_date,
  subscription_end_date, billing_key)
- tier SMALLINT (1·2·3) 추가 — 운종 Tier 시스템
- bio TEXT, oauth_provider TEXT 추가
- handle_new_user() 트리거: auth.users INSERT 시 public.users 자동 생성
  (카카오 raw_user_meta_data 에서 닉네임/아바타 추출)
- RLS: 모두 SELECT, 본인만 UPDATE

페이지 변경:
- app/auth/signup 통째 삭제 (카카오 OAuth 가 자동 생성)
- app/auth/login 페이지 V5 디자인 새로 (카카오 버튼 1개)
- app/auth/callback OAuth 콜백 정리

코드 변경:
- components/auth/AuthProvider.tsx 그대로 (이미 작동)
- stores/authStore.ts 에 tier state 추가
- types/user.ts 에서 V3 결제 필드 제거 + tier·bio·oauth_provider 추가
- stores/nicknameStore.ts ensureNickname 로그인 우선 + localStorage 폴백
- components/layout/Header.tsx 의 V3 잔재 링크 정리

⚠️ 사용자 작업 필요 (별도):
1. 카카오 Developers 콘솔에서 앱 등록 + REST API 키 발급
   - 사이트 도메인 등록, Redirect URI 등록
   - 동의항목 (닉네임·이메일·프로필 사진) 활성화
2. Supabase Dashboard 에서 Kakao Provider 활성화 + REST API 키 입력

운종 정책:
- 인증 선택사항 (비로그인도 채팅·관심종목 사용 가능)
- 로그인 시 닉네임·관심종목 영구화 (멀티 기기 동기화)
- 카카오 OAuth 만 지원 (이메일/비밀번호 제거)"
git push
```

## 검증 (사용자 안내용)

푸시 + Cowork 가 마이그레이션 016 적용 + 사용자가 카카오 콘솔·Supabase 설정 완료 후:

1. `/auth/login` 접속 → 운종 로고 + "카카오로 시작하기" 버튼 (FEE500 노란색)
2. 카카오 버튼 클릭 → 카카오 로그인 페이지 → 인증 후 `/auth/callback` → `/kr` 자동 이동
3. Header User 아이콘 클릭 → 프로필 드롭다운 (닉네임, 이메일, 마이페이지, 로그아웃)
4. Supabase Dashboard → Auth → Users 에서 카카오 가입자 확인
5. `public.users` 테이블 SELECT → 트리거가 자동 생성한 행 확인
6. 좌측 채팅에 메시지 입력 → 카카오 닉네임으로 작성됨 (트레이더-XXXX 가 아니라)

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ /auth/signup 사라짐
- ✅/❌ /auth/login V5 디자인 적용
- ✅/❌ 커밋 + 푸시
- ⚠️ DB 마이그레이션 016 — Cowork 가 별도 적용
- ⚠️ 카카오·Supabase Dashboard 설정 — 사용자 직접

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| 카카오 OAuth 미설정 → 로그인 시 에러 | error 메시지 표시 + 사용자 가이드 안내 |
| handle_new_user 트리거가 raw_user_meta_data 파싱 실패 | 닉네임 폴백 "트레이더-XXXX" 자동 |
| 기존 1명 사용자 (V3 가입) 의 nickname 충돌 | 마이그레이션이 ON CONFLICT DO NOTHING 처리 |
| Supabase Kakao Provider 가 First-class 지원 | Supabase 2024+ 부터 공식 지원 |

## 다음 STEP

- **STEP 115** — 종목 페이지 신규 (/stock/[code]) + 토론 게시판 + 종목별 채팅 (인증 위에 구축)
- **STEP 117** — 새 홈 페이지 (dashboard 처분 결정)
- **STEP 119** — Vercel 배포 + unjong.com 도메인
