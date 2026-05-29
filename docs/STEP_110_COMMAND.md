<!-- 2026-05-29 -->
# STEP 110 — 개발자 마커 일괄 제거 ("Layer 1 — XXX 연결됨 ✅")

## 실행 명령어 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `66dd282` (NEXT_SESSION_START 채팅 DB 경고 제거)
- 빌드 클린, Layer 1 전면 실데이터 완성
- 모든 카드 footer 에 "Layer 1 — XXX 연결됨 ✅" 같은 개발자 메모가 사용자에게 노출 중

## 목표
사용자에게 "Layer 1" 같은 내부 용어가 노출되지 않도록 카드 footer 정리.

| 상태 | 변경 |
|------|------|
| 성공 (실데이터) | **hint 자체 미전달** (footer 제거) |
| 로딩 중 | **hint 자체 미전달** (카드 본문에 이미 로딩 표시) |
| Fallback/에러 | **`"⚠️ 데이터 일시 불가"`** 한 줄로 통일 (Fallback 데이터로 동작 중임을 알림) |
| CardDetail "연결 예정" 안내문 | **`"준비 중"`** 으로 축약 |

CardContainer.tsx 의 `hint?: string` prop 은 **유지** (fallback 메시지 표시용으로 계속 필요).

## 작업 파일 (4개)

### 1. `components/cards/ScalperCards.tsx` (7개 카드)

다음 패턴을 **각각** 변경:

#### MoversCard (line ~191~194)
```tsx
// 기존
hint={
  data
    ? "Layer 1 — KIS ranking API 연결됨 ✅"
    : "Layer 1 — KIS ranking API 로딩 중..."
}

// 변경
hint={undefined}
```

#### VolumeCard (line ~296~299)
```tsx
hint={
  data
    ? "Layer 1 — KIS volume-rank API 연결됨 ✅"
    : "Layer 1 — KIS volume-rank API 로딩 중..."
}
// →
hint={undefined}
```

#### ViCard (line ~374~377)
```tsx
hint={
  data
    ? "Layer 1 — Movers 기반 자체 분류 (8%+ 발동, 5%+ 해제) ✅"
    : "Layer 1 — VI API 로딩 중..."
}
// →
hint={undefined}
```

#### NetBuyBrokerCard (line ~483~486)
```tsx
hint={
  data
    ? "Layer 1 — KIS investor-rank API 연결됨 ✅"
    : "Layer 1 — KIS investor-rank API 로딩 중..."
}
// →
hint={undefined}
```

#### ThemeCard (line ~580~583)
```tsx
hint={
  data
    ? "Layer 1 — 자체 테마 매핑 10개 + KIS price 평균 ✅"
    : "Layer 1 — 테마 API 로딩 중..."
}
// →
hint={undefined}
```

#### ShortCard (line ~672~675)
```tsx
hint={
  data
    ? "Layer 1 — KRX 공매도 시드 (Layer 1-A2 에서 KRX CSV 교체) ✅"
    : "Layer 1 — 공매도 API 로딩 중..."
}
// →
hint={undefined}
```

#### DisclosureCard (line ~773~776)
```tsx
hint={
  data
    ? "Layer 1 — DART Open API 연결됨 ✅"
    : "Layer 1 — DART API 로딩 중..."
}
// →
hint={undefined}
```

### 2. `components/cards/LongtermCards.tsx` (7개 카드)

#### Disclosures Filter (line 135)
```tsx
hint={isUsingFallback ? "⚠️ DART API 에러 · fallback" : data ? "Layer 1 — DART 필터링 연결됨 ✅" : "Layer 1 — DART 로딩 중..."}
// →
hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
```

#### Earnings Calendar (line 201)
```tsx
hint={data ? "Layer 1 — 자체 캘린더 + 컨센서스 ✅" : "Layer 1 — 캘린더 로딩 중..."}
// →
hint={undefined}
```

#### Sector Card (line 266)
```tsx
hint={error ? "⚠️ 섹터 API 에러 · fallback" : data ? "Layer 1 — KIS sector 자체 매핑 ✅" : "Layer 1 — 섹터 로딩 중..."}
// →
hint={error ? "⚠️ 데이터 일시 불가" : undefined}
```

#### Value (quant_factors) (line 326)
```tsx
hint={isUsingFallback ? "⚠️ DB 에러 · fallback" : data ? "Layer 1 — quant_factors DB 연결됨 ✅" : "Layer 1 — DB 로딩 중..."}
// →
hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
```

#### Dividend Top (line 393)
```tsx
hint={isUsingFallback ? "⚠️ DB 에러 · fallback" : data ? "Layer 1 — dividends DB 연결됨 ✅" : "Layer 1 — DB 로딩 중..."}
// →
hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
```

#### 52W Lows (line 460)
```tsx
hint={isUsingFallback ? "⚠️ DB 에러 · fallback" : data ? "Layer 1 — stock_prices DB 연결됨 ✅" : "Layer 1 — DB 로딩 중..."}
// →
hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
```

#### KRX Warning (line 530)
```tsx
hint={isUsingFallback ? "⚠️ KRX API 에러 · fallback" : data ? "Layer 1 — KRX 관리종목 시드 ✅" : "Layer 1 — 로딩 중..."}
// →
hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
```

### 3. `components/cards/CardDetail.tsx` (2곳)

#### Line 82
```tsx
// 기존
Layer 1 — 실데이터 + 풀 리스트 연결 예정
// 변경
준비 중
```

#### Line 118
```tsx
// 기존
Layer 1 — 실제 필터/정렬 동작 연결 예정
// 변경
준비 중
```

### 4. `components/sidebar/WatchlistPanel.tsx` (1곳)

#### Line 222
```tsx
// 기존
<p className="text-[10px] text-unjong-muted italic text-center">Layer 1 — KIS·Yahoo · 30초 폴링 ✅</p>
```

**그리고 그 부모 `<div className="border-t border-unjong-border bg-unjong-background px-2 py-1 flex-shrink-0">` 도 같이 제거** (footer 영역 자체 삭제):

```tsx
// 기존 — 이 블록 전체 제거
<div className="border-t border-unjong-border bg-unjong-background px-2 py-1 flex-shrink-0">
  <p className="text-[10px] text-unjong-muted italic text-center">
    Layer 1 — KIS·Yahoo · 30초 폴링 ✅
  </p>
</div>
```

(헤더에 이미 30초 갱신이라는 시각적 단서 — 가격 변동 — 으로 충분함)

### 5. 잔여 검색 — 누락 방지

```bash
grep -rn "Layer 1 —" components/ 2>&1
```

위 결과가 **0건** 이어야 함. 1건이라도 남아있으면 수동 제거.

### 6. 빌드 검증

```bash
npm run build 2>&1 | tail -20
```

타입 에러 없어야 함 (hint 가 optional 이라 undefined 전달 OK).

### 7. 커밋 + 푸시

```bash
git add components/cards/ScalperCards.tsx components/cards/LongtermCards.tsx components/cards/CardDetail.tsx components/sidebar/WatchlistPanel.tsx
git commit -m "chore(ui): 'Layer 1 — XXX 연결됨 ✅' 개발자 마커 일괄 제거

이유: Layer 1 전면 실데이터 완성됨. 사용자에게 'Layer 1' 같은 내부 용어
노출은 시각적 쓰레기. 카드 footer 메모는 개발 중 디버깅용이었음.

변경:
- 성공/로딩 상태: footer 자체 제거 (hint 미전달)
- Fallback/에러 상태: '⚠️ 데이터 일시 불가' 로 통일 (사용자 친화적)
- CardDetail 의 '연결 예정' 안내문 → '준비 중'
- WatchlistPanel 하단 footer 영역 자체 삭제

영향:
- ScalperCards 7개 카드 footer 제거
- LongtermCards 7개 카드 fallback 메시지만 유지
- CardDetail 2곳 단순화
- WatchlistPanel footer 제거"
git push
```

## 검증 (사용자 안내용)

푸시 후:
1. 브라우저 하드 리프레시
2. 단타창·장타창·미국주식창 각 페이지의 7개 카드 → **하단 footer 사라짐**
3. 우측 관심종목 패널 → **하단 footer 사라짐**
4. 카드 디테일 페이지 (예: `/scalper/movers`) → "준비 중" 으로 변경
5. 화면이 더 깔끔해졌는지 시각적 확인

## 완료 후 보고

- ✅/❌ 빌드 결과
- ✅/❌ `grep "Layer 1 —" components/` 결과 0건 확인
- ✅/❌ 커밋 해시 + 푸시 결과
