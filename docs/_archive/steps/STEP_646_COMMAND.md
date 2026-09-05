<!-- 2026-07-07 -->
# STEP 646 — JP 공시 데이터층 (EDINET → jp_disclosures 크론)

> **완전성 청산 ②-JP (공시 R1)**: 일본 공시를 US(EDGAR)·KR(DART)와 동형으로. 소스 = **EDINET(금융청·무료 공식 API)**. 예전 "무료 소스 없어 보류"는 룰 위반이었음 → EDINET으로 제대로.
>
> **키 = env** (사용자가 `.env.local` + Vercel에 `EDINET_API_KEY` 등록 완료). 코드/깃엔 값 없음.
>
> **EDINET 특성**: `documents.json`은 '날짜별' 조회만·회사 필터 없음 → 플레이북 미리계산 원칙대로 **크론이 매일 긁어 `jp_disclosures` 테이블에 저장** → 종목 페이지는 secCode로 즉시 조회(다음 STEP).
>
> **Cowork이 이미 함** (tsc EXIT=0):
> - `jp_disclosures` 테이블 = **Supabase MCP로 이미 생성**(doc_id PK·sec_code·doc_type_code·doc_description·submit_datetime·current_report_reason). 기록용 마이그 `supabase/migrations/039_jp_disclosures.sql`.
> - `lib/edinet.ts` — EDINET 클라이언트(`fetchEdinetDocsForDate`·`secCodeOf` 7203.T→72030).
> - `app/api/cron/jp-disclosures/route.ts` — 매일 최근 N일 긁어 upsert(`?days=45`=백필).
> - `vercel.json` — 크론 `/api/cron/jp-disclosures` 매일 16:00 UTC(=01:00 JST) 추가.
>
> **전제**: STEP 645(`0023fda`) 이후. **빌드 + 커밋만** (데이터 백필·검증은 배포 후 Cowork).

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error|jp-disclosures" | head -10
```
- ✅ 기대: `Compiled successfully`.

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "edinet|jp-disclosures|039_jp|vercel.json"
```
- 기대: `?? lib/edinet.ts` · `?? app/api/cron/jp-disclosures/` · `?? supabase/migrations/039_jp_disclosures.sql` · `M vercel.json`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add lib/edinet.ts app/api/cron/jp-disclosures/route.ts supabase/migrations/039_jp_disclosures.sql vercel.json docs/STEP_646_COMMAND.md && git commit -m "feat(jp-disclosure): EDINET 공시 데이터층 — jp_disclosures 크론(미리계산)·완전성 청산 ②-JP" && git push
```

## 3) (배포 후) Cowork 백필 + 검증
- `onetrillion.app/api/cron/jp-disclosures?days=45` 호출 → 최근 45일 공시 upsert.
- `jp_disclosures`에서 도요타(sec_code 72030) 공시 뜨는지 확인.

## ✅ 완료 시 → 다음 STEP 647: **JpEventLayer + R1 원문 요약** (종목 페이지 배선).
