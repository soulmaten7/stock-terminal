<!-- 2026-05-31 -->
# STEP 127 — 가독성 리뉴얼 (Pretendard 폰트 + 크기·spacing 상향)

🔴 **Opus 권장** (전역 영향 — 폰트 + 30+ 컴포넌트 텍스트 크기·spacing)

## 실행 명령어 (Opus)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- 이전 커밋: `b796675` (STEP 126 종목 페이지 핫픽스)
- 운종 V5 PC 기능 완성, 단 시각 가독성이 네이버 페이 증권 대비 30~40% 작음
- 사용자 결정: **옵션 B (한 번에) — Pretendard 도입 + 본문 한 단계 상향 + 카드 spacing 조정**

## 사용자 의도

> "네이버 증권 정도의 크기로 맞춰주는게 좋을거같아. 텍스트의 글꼴이나 모양 바른 레이아웃의 느낌도. 네이버가 토스증권보다 눈이 편하다."

네이버 페이 증권 가독성 분석:
- 본문 ~14~15px / 헤더 ~16~18px / 보조 ~12~13px
- 한국어 친화 폰트 (Pretendard 계열)
- 카드 패딩 16~24px / gap 12~16px
- 줄간격 1.5

운종 V5 현재:
- 본문 11~12px (text-xs) / 헤더 14px / 보조 9~10px ([10px])
- Inter (영어 폰트)
- 카드 패딩 12~16px / gap 16px
- 줄간격 1.3 (leading-snug)

→ **한 단계씩 상향 + 폰트 교체**.

## 목표

| 영역 | 변경 |
|------|------|
| **폰트** | Inter (영어) → **Pretendard Variable** (한국어 친화) |
| **본문 텍스트** | text-xs (12px) → text-sm (14px) |
| **보조 텍스트** | text-[10px] → text-xs (12px) · text-[11px] → text-xs |
| **헤더 텍스트** | text-sm → text-base · text-base → text-lg (선택) |
| **카드 padding** | p-3 → p-4 · px-3 py-2 → px-4 py-3 |
| **gap** | gap-2 → gap-3 · gap-3 → gap-4 (선택) |
| **줄간격** | leading-snug → leading-normal (1.5) |

⚠️ 영향 범위: **전역**. 30+ 컴포넌트.

---

## 작업 디테일

### [1] Pretendard 폰트 도입

#### 방법 A — CDN @import (가장 간단, 추천)

`app/globals.css` 최상단에 추가:

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/[email protected]/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
```

#### 방법 B — next/font/google (선택)

Pretendard 가 Google Fonts 에 있는지 확인. 없으면 방법 A.

#### Tailwind v4 폰트 설정 — `app/globals.css`

기존 폰트 관련 CSS 변수 위에 또는 `@theme` 안에:

```css
@theme {
  --font-sans: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
}
```

또는 `body` 에 직접:
```css
body {
  font-family: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
}
```

#### `app/layout.tsx` — Inter 보조 폰트로 강등

기존:
```tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-playfair', display: 'swap' });

<html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
```

변경 (Inter 제거, Playfair 만 보조 유지 — UNJONG 로고 영문용):
```tsx
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-playfair', display: 'swap' });

<html lang="ko" className={`${playfair.variable} h-full`}>
```

(Pretendard 는 CSS 변수로 들어가서 inter 변수 클래스 불필요)

### [2] 텍스트 크기 일괄 상향 — grep + 수동 검토

#### 자동 검출:
```bash
echo "=== text-xs 사용처 ==="
grep -rn "text-xs" --include="*.tsx" components/ app/ 2>/dev/null | grep -v node_modules | wc -l

echo "=== text-[10px] 사용처 ==="
grep -rn 'text-\[10px\]' --include="*.tsx" components/ app/ 2>/dev/null | grep -v node_modules | wc -l

echo "=== text-[11px] 사용처 ==="
grep -rn 'text-\[11px\]' --include="*.tsx" components/ app/ 2>/dev/null | grep -v node_modules | wc -l
```

#### 일괄 치환 — 다음 규칙으로

| Before | After | 의미 |
|--------|-------|------|
| `text-[10px]` | `text-xs` (12px) | 보조 → 가독 가능한 최소 |
| `text-[11px]` | `text-xs` | 같음 |
| `text-xs` | `text-sm` (14px) | 본문 |
| `text-sm` | `text-base` (16px) | **선택 — 영향 큼, 단계 진행** |

⚠️ **text-sm → text-base 는 신중**. 일부 컴포넌트에선 적당. 일괄 적용 시 화면 너무 크게 변할 수 있음.

**추천 적용 범위**:
- ✅ `text-[10px]` → `text-xs` (전체)
- ✅ `text-[11px]` → `text-xs` (전체)
- ✅ `text-xs` → `text-sm` (전체)
- ⚪ `text-sm` → 그대로 (이번 STEP X — 추후 사용자 시각 확인 후)

#### sed 일괄 (테스트 후 적용):
```bash
# 백업 후 적용
find components app -name "*.tsx" -type f -exec sed -i.bak 's/text-\[10px\]/text-xs/g; s/text-\[11px\]/text-xs/g; s/text-xs/text-sm/g' {} \;

# 백업 파일 정리 (확인 후)
find . -name "*.bak" -delete
```

⚠️ **sed 일괄 위험 — Claude Code 가 수동 검토 권장**. 또는 sed 후 빌드·시각 확인 후 롤백 가능.

### [3] 카드 padding 조정

```bash
grep -rn "p-3\|p-4\|px-3 py-2\|px-4 py-3" --include="*.tsx" components/ 2>/dev/null | grep -v node_modules | wc -l
```

| Before | After |
|--------|-------|
| `p-3` (12px) | `p-4` (16px) |
| `px-3 py-2` | `px-4 py-3` |
| `px-3 py-1.5` | `px-3 py-2` 또는 그대로 (작은 버튼) |

영향: 카드 안 콘텐츠가 더 여유있게.

### [4] gap 조정 (선택, 미세)

```bash
grep -rn "gap-2\b\|gap-3\b" --include="*.tsx" components/ 2>/dev/null | grep -v node_modules | wc -l
```

| Before | After |
|--------|-------|
| `gap-2` (8px) | `gap-3` (12px) — 일부 |
| `gap-3` (12px) | 그대로 또는 `gap-4` (16px) |

⚠️ 일괄 변경 시 디자인 부서 영향. 일부만 신중하게.

### [5] 줄간격 조정

```bash
grep -rn "leading-snug\|leading-tight\|leading-relaxed" --include="*.tsx" components/ 2>/dev/null | grep -v node_modules | wc -l
```

| Before | After |
|--------|-------|
| `leading-snug` (1.375) | `leading-normal` (1.5) — 본문 |
| `leading-tight` (1.25) | `leading-snug` (1.375) — 헤딩 등 |
| `leading-relaxed` (1.625) | 그대로 |

### [6] 빌드 검증 + 시각 확인

```bash
npm run build 2>&1 | tail -15
```

체크:
- 빌드 클린
- TypeScript·ESLint 에러 0
- 폰트 CDN @import 정상 로드 (브라우저 콘솔 확인)
- 텍스트 크기 시각적으로 더 크게 (사용자 하드 리프레시 후 확인)

### [7] 4개 문서 헤더 갱신

### [8] 커밋 + 푸시

```bash
git add -A
git commit -m "feat(typography): 가독성 리뉴얼 — Pretendard + 한 단계 상향

폰트:
- Inter (영어) → Pretendard Variable (한국어 친화)
- CDN @import (jsDelivr — pretendardvariable-dynamic-subset)
- Tailwind v4 @theme --font-sans 변경
- app/layout.tsx 에서 Inter 제거, Playfair 보조 유지 (UNJONG 로고)

텍스트 크기 일괄 상향:
- text-[10px] → text-xs (12px) — 보조 텍스트
- text-[11px] → text-xs (12px)
- text-xs (12px) → text-sm (14px) — 본문
- text-sm → 그대로 (이번 STEP X, 추후 사용자 시각 확인 후)

카드 padding 조정:
- p-3 (12px) → p-4 (16px) — 카드 내 여유 공간
- px-3 py-2 → px-4 py-3 — 헤더 padding

줄간격 조정:
- leading-snug (1.375) → leading-normal (1.5) — 본문 가독성

영향: 30+ 컴포넌트. 사용자 시각 의도 = '네이버 페이 증권 수준 가독성' 반영.
배경: 사용자 비교 — '네이버가 토스보다 눈이 편함, 운종도 그 수준으로'."
git push
```

## 검증 (사용자 안내용)

푸시 후 **하드 리프레시 (Cmd + Shift + R)**:

1. 모든 페이지 텍스트 한 단계 크게 보임
2. 폰트 한국어 친화 (Pretendard)
3. 카드 안 여유 공간 증가
4. 줄간격 더 편안
5. 운종 = 네이버 페이 증권 수준 가독성

## 완료 후 보고

- ✅/❌ 빌드 클린
- ✅/❌ Pretendard 폰트 로드 확인
- ✅/❌ text-xs → text-sm, text-[10px] → text-xs 일괄 치환 수
- ✅/❌ 카드 padding 조정 수
- ✅/❌ 커밋 + 푸시
- 스크린샷 차이 (전후 비교 가능하면 사용자 확인)

## 잠재 이슈

| 이슈 | 대응 |
|------|------|
| Pretendard CDN 응답 늦으면 FOIT (텍스트 깜빡임) | font-display: swap (CDN URL 자체 지원) |
| text-xs → text-sm 일괄 적용 시 일부 배지·footer 너무 큼 | 시각 확인 후 미세 조정 (특정 컴포넌트만 text-xs 유지 가능) |
| 카드 padding p-3 → p-4 가 디자인 위계 흐트림 | 일부만 조정 또는 단계 진행 |
| 1984px 컨테이너에 텍스트 크면 정보 표시량 ↓ | 의도된 trade-off (가독성 우선) |
| Playfair_Display 가 한국어 폰트와 어색 | UNJONG 로고만 사용. 그대로 유지 |

## 다음 STEP

- 사용자 시각 확인 후 미세 조정 (특정 영역 더 키울지·줄일지)
- MVP 2.0 (상품·리딩방 평가) 시작
- 카카오 OAuth 활성화 (도메인 후)
- 모바일 반응형
- Vercel 배포 + unjong.com
