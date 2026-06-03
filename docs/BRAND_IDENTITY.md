<!-- 2026-06-03 -->
# 운종(雲從) 브랜드 아이덴티티

> **V5 갱신 (2026-06-03)**: 디자인 시스템 섹션 추가 (네이버 레이아웃 + 토스 카드 + Pretendard).

## 운종 V5 디자인 시스템 (2026-06-03)

### 폰트
- **본문**: Pretendard Variable (CDN @import — 한국어 친화)
- **보조**: Playfair_Display (UNJONG 로고 영문용)
- **루트 폰트 크기**: 16px (Tailwind 표준 — STEP 127 에서 13→16 변경)

### 색상
**운종 brand (기존 유지)**:
- Primary: `#0F1E3D` (deep blue)
- Accent: `#D4AF37` (gold)
- Background: 흰색 + 차분한 회색

**토스 보조 (STEP 129 추가)**:
- 상승: `#1AC267` (선명한 그린)
- 하락: `#F04452` (선명한 레드)
- Blue: `#3182F6` (토스 브랜드 — 운종 직접 사용 X)
- 차분한 회색: `#F9FAFB` · `#F2F4F6` · `#4E5968` · `#191F28`

**카카오 (auth)**:
- `#FEE500` (카카오 노란색 — 로그인 버튼만)

### Spacing & Layout
- 컨테이너 max-w: **1984px** (토스 동일)
- 카드 padding: **p-5** (20px)
- 카드 그리드 gap: **gap-5**
- 카드 안 행 padding: py-3 px-3
- 카드 border-radius: **rounded-2xl** (16px)

### 그림자
- `.shadow-soft`: `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` — 카드 기본
- `.shadow-soft-hover`: `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)` — hover 시 부드러운 전환

### 타이포그래피
- 헤더: text-base ~ text-lg (16~18px) + font-bold
- 본문: text-sm (14px) + font-medium/semibold
- 보조: text-xs (12px)
- 종목 코드: font-mono + text-unjong-muted

### 카드 패턴 (운종 V5)
```tsx
<section className="
  bg-unjong-surface rounded-2xl border border-unjong-border
  shadow-soft hover:shadow-soft-hover transition-shadow duration-200
  p-5
">
```

### 등락 표시 (운종 V5)
```tsx
<span className={isUp ? "text-[#1AC267]" : "text-[#F04452]"}>
  {isUp ? "+" : ""}{changePct.toFixed(2)}%
</span>
```

### 레이아웃 패턴
- 종목 페이지: `grid-cols-[320px_1fr_380px]` (좌 sticky 정보 / 중 탭 시스템 / 우 sticky 채팅)
- 새 홈: `grid-cols-[320px_1fr_320px]` (좌 채팅 / 중 모듈 순서 / 우 관심종목)
- 우측 fixed nav: 48px @ `right-0 top-1/2 -translate-y-1/2`

---

## 이름

## 이름
- 한자: **雲從**
- 한글: **운종**
- 영문: **Unjong**

## 의미
조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리".
조선 시대 모든 정보·자본·뉴스가 흐르던 광장. 운종은 그 정체성을 한국 주식 시장에 부활시킨다.

## 태그라인
- 메인: **"한국 주식 동선의 출발점"**
- 보조: **"모든 자산이 운집(雲集)하는 곳"**
- 영문: **"All assets converge"**

## 정체성 5가지
1. **정보** — 매매 스타일별 카드 큐레이션
2. **대화** — 3창 분리 (단타/장타/미국) 실시간 채팅
3. **허브** — 모든 한국 주식 사이트 출발점
4. **수익** — Partner-Agnostic Lead Gen (광고·계좌·강의)
5. **신뢰** — 인증 시스템 3 Tier

## 색상 팔레트
| 용도 | 색상 | HEX |
|------|------|-----|
| 메인 | 짙은 남색 (먹물·밤하늘) | `#0F1E3D` |
| 포인트 | 금색 (부의 상징) | `#D4AF37` |
| 상승 | 청록색 (수익률) | `#0E7C7B` |
| 하락 | 빨강 (글로벌 표준) | `#C73E3A` |
| 배경 | 연회색 | `#F5F5F7` |
| 카드 | 흰색 | `#FFFFFF` |

## 로고 컨셉 (Layer 6 디자인)
- 雲(운) 한자의 부드러운 곡선 + 從(종) 의 따르는 사람 형상
- 또는 단순히 雲從 한자 + Unjong 영문 병기
- 색상: 짙은 남색 + 금색 포인트

## 도메인 전략
- 메인: `onetrillion.app` (보유 중) — 비전 명시
- 보호용 (Layer 6): `unjong.com` + `unjong.app` 추가 구매 권장 ($21)
- 운종 검색 → unjong.com → onetrillion.app 자동 전환

## 글로벌 전략
- 영어판 만들지 않음
- 국가별 별도 페이지 (Layer 7+, 일본·미국 진출 시)
- 한국 시장 전력 집중

## 참조
- 비전·구조 전체: `docs/PRODUCT_SPEC_V4.md`
- 운종가 역사: 조선 한양 종로, 육의전 (六矣廛) 공식 시장
