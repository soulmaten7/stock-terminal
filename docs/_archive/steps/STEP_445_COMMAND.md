<!-- 2026-06-28 -->
# STEP 445 — 리딩방 리스트 표화 (|등록업체명|채널명| 2컬럼 + 헤더)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_445_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
리스트를 **스택(업체명+밑에 채널명)** → **표(한 줄 2컬럼)** 로:
- 리스트 위에 **컬럼 헤더**: `#` · 등록업체명 · 채널명
- 각 행: 등록업체명(메인) | 채널명(회색) 한 줄 정렬, 액션(⭐·🚨·바로가기)은 고정폭 컬럼.
- 종목·상품 표와 UI 통일.

## 전제
- 최신 main + STEP 444. **`components/toolbox/AdvisorDirectory.tsx` 1파일**. 클라이언트 컴포넌트 → **HMR(재시작 불필요).** 커밋 보류.

---

## (1) 컬럼 헤더 추가 + `<ul>` 프래그먼트로 감싸기
**찾기:**
```tsx
          ) : (
            <ul>
              {results.map((a, i) => {
```
**바꾸기:**
```tsx
          ) : (
            <>
              <div className="grid grid-cols-[1.75rem_1.5fr_1fr_7rem] items-center gap-2 border-b border-l-2 border-l-transparent border-b-unjong-border px-2 py-1.5 text-[11px] font-medium text-unjong-muted">
                <span className="text-center">#</span>
                <span>등록업체명</span>
                <span>채널명</span>
                <span />
              </div>
              <ul>
              {results.map((a, i) => {
```

## (2) `<li>` 행 — flex 스택 → grid 2컬럼
**찾기:**
```tsx
                    <li
                    className={`group flex items-center gap-3 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
                      isSel ? 'border-l-unjong-accent bg-unjong-background' : 'border-l-transparent'
                    }`}
                  >
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="w-6 shrink-0 text-center text-sm font-bold text-unjong-muted">{n}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{a.company_name}</span>
                          {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="유사투자자문 신고" /> : null}
                        </span>
                        {a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? (
                          <span className="truncate text-[11px] text-unjong-muted">{a.info_name}</span>
                        ) : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFav(a)}
                      aria-label={favs.has(a.biz_no) ? '즐겨찾기 해제' : '즐겨찾기'}
                      title="관심(즐겨찾기)"
                      className={`flex shrink-0 items-center gap-0.5 text-xs tabular-nums transition-colors ${favs.has(a.biz_no) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                    >
                      <Star size={14} fill={favs.has(a.biz_no) ? 'currentColor' : 'none'} />
                      {a.favorite_count > 0 ? <span>{a.favorite_count}</span> : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => openReport(a)}
                      title="신고하기"
                      aria-label="신고하기"
                      className="flex shrink-0 items-center gap-0.5 text-xs text-unjong-muted hover:text-red-500"
                    >
                      <Siren size={13} /> {a.report_count > 0 ? a.report_count : ''}
                    </button>
                    {a.homepage ? (
                      <a
                        href={a.homepage}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        title="바로가기"
                        className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                      >
                        <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </li>
```
**바꾸기:**
```tsx
                    <li
                    className={`group grid grid-cols-[1.75rem_1.5fr_1fr_7rem] items-center gap-2 border-b border-b-unjong-border border-l-2 px-2 py-2.5 transition-colors hover:bg-unjong-background ${
                      isSel ? 'border-l-unjong-accent bg-unjong-background' : 'border-l-transparent'
                    }`}
                  >
                    <span className="text-center text-sm font-bold text-unjong-muted">{n}</span>
                    <button type="button" onClick={() => setSelected(a)} className="flex min-w-0 items-center gap-1.5 text-left">
                      <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{a.company_name}</span>
                      {a.source === 'fss' ? <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="유사투자자문 신고" /> : null}
                    </button>
                    <button type="button" onClick={() => setSelected(a)} className="min-w-0 truncate text-left text-xs text-unjong-muted">
                      {a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? a.info_name : '—'}
                    </button>
                    <span className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFav(a)}
                        aria-label={favs.has(a.biz_no) ? '즐겨찾기 해제' : '즐겨찾기'}
                        title="관심(즐겨찾기)"
                        className={`flex shrink-0 items-center gap-0.5 text-xs tabular-nums transition-colors ${favs.has(a.biz_no) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={favs.has(a.biz_no) ? 'currentColor' : 'none'} />
                        {a.favorite_count > 0 ? <span>{a.favorite_count}</span> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => openReport(a)}
                        title="신고하기"
                        aria-label="신고하기"
                        className="flex shrink-0 items-center gap-0.5 text-xs text-unjong-muted hover:text-red-500"
                      >
                        <Siren size={13} /> {a.report_count > 0 ? a.report_count : ''}
                      </button>
                      {a.homepage ? (
                        <a
                          href={a.homepage}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          title="바로가기"
                          className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                        >
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </span>
                  </li>
```

## (3) `</ul>` 닫기 — 프래그먼트 닫기 추가
**찾기:**
```tsx
              })}
            </ul>
          )}
```
**바꾸기:**
```tsx
              })}
            </ul>
            </>
          )}
```

---

## 확인 (localhost, HMR)
- 리스트 위에 **컬럼 헤더**: `#  등록업체명  채널명` (회색 작은 글씨).
- 각 행: **[번호] [등록업체명 + 🛡] [채널명] [⭐ 🚨 바로가기]** 한 줄, 컬럼이 헤더와 세로로 정렬됨.
- 채널명 없는 곳(info_name=업체명/없음)은 **`—`** 표시.
- 행 클릭(번호 제외 업체명/채널명) → 미리보기 그대로 열림. 별·신고·바로가기 동작.
- 빌드 에러 없음.

## 참고
- 인피드 '광고' 행(SponsoredRoomRow)은 그리드 아님 — 강조 행이라 그대로 둠(정렬 약간 다른 건 의도).

## 빌드·커밋
- 보류. 확인 후 커밋. push·배포는 사용자 지시 시.
