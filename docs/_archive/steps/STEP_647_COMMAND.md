<!-- 2026-07-07 -->
# STEP 647 — JP 공시 크론 dedup 픽스 (백필 완결)

> **상황**: STEP 646 배포 + Vercel `EDINET_API_KEY` 등록·재배포 완료 → **데이터층 작동 확인**(라이브 백필로 5,999건·2,148개사·중대공시 2,260건 upsert 성공). EDINET→jp_disclosures 파이프라인 검증됨.
>
> **버그**: 전체 백필(45일)이 **6,000건에서 멈춤** — 에러 `ON CONFLICT DO UPDATE cannot affect row a second time`. 원인 = 같은 `doc_id`가 여러 날짜 리스트에 나와 한 upsert 배치에 중복 PK. → **dedup 누락.**
>
> **Cowork이 이미 함** (tsc EXIT=0): `app/api/cron/jp-disclosures/route.ts`에 upsert 전 `doc_id` 중복 제거(Set) 추가.
>
> **전제**: STEP 646(`0ea7189`) 이후. **빌드 + 커밋만** (push하면 Vercel 자동 재배포 — 이제 키 등록돼 있어 바로 작동).

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error" | head -8
```

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep "jp-disclosures"
```
- 기대: `M app/api/cron/jp-disclosures/route.ts`

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add app/api/cron/jp-disclosures/route.ts docs/STEP_647_COMMAND.md && git commit -m "fix(jp-disclosure): 크론 doc_id dedup — 45일 전체 백필 완결(ON CONFLICT 중복 방지)" && git push
```

## 3) (배포 후) Cowork 전체 백필 + 검증
- `onetrillion.app/api/cron/jp-disclosures?days=45` 재호출 → 이번엔 끝까지 upsert.
- 도요타(72030)·소니(67580) 등 공시 뜨는지 확인.

## ✅ 완료 시 → JP 공시 데이터층 완결 → 다음 STEP 648: **JpEventLayer + R1 원문 요약**(종목 페이지 배선).
