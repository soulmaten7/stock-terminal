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
- 한자: **雲從**
- 한글: **운종**
- 영문: **Unjong**

## 의미
조선 한양 종로의 옛 이름 **운종가(雲從街)** — "구름처럼 사람이 모이는 거리".
조선 시대 모든 정보·자본·뉴스가 흐르던 광장. 운종은 그 정체성을 한국 주식 시장에 부활시킨다.

## 태그라인
- 메인: **"한국 금융 동선의 출발점"** (V5 — MVP 2.0 상품·리딩방 평가 포함 의미)
- 보조: **"모든 자산이 운집(雲集)하는 곳"**
- 영문: **"All assets converge"**

## 정체성 4박자 (V5 — 2026-06-01 합의)
1. **정보** — 한국 5개·미국 4개 정확 카드 + 종목별 가격·차트·뉴스·공시
2. **대화** — 종목별 채팅 + 토론·댓글 (Realtime + Tier 표시)
3. **허브** — 모든 한국 금융 사이트 출발점 (네이버·키움·FnGuide·Investing 외부 동선)
4. **신뢰** — 상품·리딩방 평가 디렉토리 (Trustpilot 금융 한국판 — MVP 2.0) + Tier 1·2·3 인증

> **이전 5가지 (V4 보존)**: 정보·대화·허브·수익·신뢰 (광고는 "수익" 별도 항목이었음 → V5 에서 "신뢰" 안에 Tier 인증 광고 통합).

## 색상 팔레트 (V4 — 이력 보존)

> ⚠️ V5 부터는 상단 "운종 V5 디자인 시스템" 색상이 활성. 아래 V4 팔레트는 이력 보존 용.

| 용도 | 색상 | HEX |
|------|------|-----|
| 메인 (V4·V5 공통) | 짙은 남색 (먹물·밤하늘) | `#0F1E3D` |
| 포인트 (V4·V5 공통) | 금색 (부의 상징) | `#D4AF37` |
| 상승 (V4 → V5 변경) | 청록색 → 토스 그린 | ~~`#0E7C7B`~~ → `#1AC267` |
| 하락 (V4 → V5 변경) | 빨강 → 토스 레드 | ~~`#C73E3A`~~ → `#F04452` |
| 배경 | 연회색 | `#F5F5F7` (V4) · `#F9FAFB`·`#F2F4F6` (V5) |
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
- 최신 비전 (V5): `docs/NEXT_SESSION_START.md` + `docs/SESSION_KICKOFF.md`
- V4 비전 (이력 보존): `docs/PRODUCT_SPEC_V4.md`
- V3 히스토리: `docs/PRODUCT_SPEC_V3.md`
- 운종가 역사: 조선 한양 종로, 육의전 (六矣廛) 공식 시장
