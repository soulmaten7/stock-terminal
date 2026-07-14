<!-- 2026-07-14 -->
# STEP 707 — 페이지 폭 시스템 정립 (역할별 폭)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** "전부 같은 폭"이 아니라 **역할에 맞는 폭**으로 통일. 데이터 화면은 넓게, 읽는 페이지는 좁은 읽기 폭 가운데 정렬. (세계급 정석 — 데이터는 폭 필요, 글은 한 줄 50~75자·CJK 40자가 최적.)
**전제:** 최신 main (다크 3단계 + 07-14 문서 동기화 이후).

---

## 폭 규칙 (앞으로 이 표가 기준)
| 역할 | 폭 | 페이지 |
|------|-----|--------|
| **데이터·앱 셸** | `max-w-7xl`(1280px) | 홈/보드, 종목 렌즈, 관심종목, 마이페이지, 관리자, 증권사 등록(business) |
| **랜딩(비주얼 2열)** | `max-w-7xl` | 광고 안내(advertise — info+form 2열) |
| **읽기·법적** | **`max-w-3xl`(768px) 가운데** | 소개(about), 이용약관(terms), 개인정보(privacy) |
| **폼** | narrow 가운데 | 피드백(`max-w-2xl`), 로그인(`max-w-md/sm` flex-center) |

### 전수 감사 결과 (3중 검수)
- **이미 적정(변경 X):** 홈·stock·favorites·mypage·admin·business = 7xl(데이터) · advertise = 7xl(2열 landing) · feedback = 2xl(폼) · auth/login·admin/login = `flex items-center justify-center` + `max-w-md/sm` 카드(폼, 정상) · coin = 7xl 준비중 안내(text-center, 무해).
- **오분류(고칠 것):** **about·terms·privacy = 현재 `max-w-7xl`** → 읽기 페이지인데 데이터 폭. **→ `max-w-3xl` 가운데로.**

---

## 작업 (3파일)

### 1. `app/terms/page.tsx` — 컨테이너 폭만
```
<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">   →   max-w-3xl
```

### 2. `app/privacy/page.tsx` — 컨테이너 폭만
```
<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">   →   max-w-3xl
```

### 3. `app/about/page.tsx` — 읽기 레이아웃으로 (전체 교체)
3열 그리드는 넓은 폭용이었으니, 좁은 읽기 폭 + **세로 스택**으로. 파일 전체를 아래로 교체:
```tsx
export const metadata = { title: "서비스 소개" };

const PILLARS: { t: string; d: string }[] = [
  { t: "무기", d: "기관이 쓰는 분석의 눈을 개인 손에. TR-AI 렌즈가 모멘텀·밸류·퀄리티 등 검증된 기법으로 종목을 읽어드려요." },
  { t: "직시", d: "시세·뉴스·공시를 1차 재료 그대로. 데이터가 없으면 지어내지 않고 “데이터 부족”이라 말합니다." },
  { t: "자립", d: "사고팔 신호는 없습니다. 검증된 시각을 나란히 놓아드릴 뿐, 결정은 당신 몫이에요." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-bold text-unjong-primary">트릴리언 소개</h1>
      <p className="text-base font-semibold text-unjong-accent">종목을 보는 눈을, 누구에게나.</p>
      <p className="mt-1 text-sm text-unjong-muted">모든 시각을 데이터로 — 판단은 당신입니다.</p>
      <p className="mt-8 text-sm leading-relaxed text-unjong-muted">
        예측도, 추천도 하지 않습니다. 전문가들이 쓰는 검증된 기법으로 종목을{" "}
        <span className="font-medium text-unjong-primary">데이터로 보여드리고</span>, 판단은 당신에게 맡깁니다.
      </p>

      <div className="mt-10 space-y-4">
        {PILLARS.map((p) => (
          <section key={p.t} className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
            <h2 className="mb-1 text-base font-bold text-unjong-primary">{p.t}</h2>
            <p className="text-sm leading-relaxed text-unjong-muted">{p.d}</p>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">이렇게 봅니다</h2>
        <ol className="space-y-2.5 text-sm leading-relaxed text-unjong-muted">
          <li><span className="font-medium text-unjong-primary">1.</span> 종목을 고르면,</li>
          <li><span className="font-medium text-unjong-primary">2.</span> TR-AI 렌즈가 모멘텀·밸류·퀄리티 등 검증된 기법으로 그 종목을 저마다 어떻게 보는지 나란히 보여줘요.</li>
          <li><span className="font-medium text-unjong-primary">3.</span> 사고팔 신호는 없어요. 판단은 당신 몫이에요.</li>
        </ol>
      </section>

      <blockquote className="mt-10 border-l-2 border-unjong-accent pl-4 text-sm italic leading-relaxed text-unjong-muted">
        “사람이 할 수 있는 가장 좋은 일은, 다른 사람이 더 많이 알도록 돕는 것이다.”
        <footer className="mt-1 text-xs not-italic text-unjong-muted/80">— 찰리 멍거</footer>
      </blockquote>

      <p className="mt-10 text-xs leading-relaxed text-unjong-muted">
        트릴리언은 금융상품의 매매·중개·투자자문을 제공하지 않으며, 어떠한 거래도 중개하지 않습니다. 트릴리언이 제공하는 정보는 참고용이며, 투자 권유나 자문이 아닙니다.
      </p>
    </div>
  );
}
```

### 4. 빌드 + 커밋
```bash
npm run build
git add -A && git commit -m "ui: 페이지 폭을 역할별로 — 읽기 페이지(about·terms·privacy) max-w-7xl→3xl 가운데(읽기 폭·CJK 최적), 데이터/폼 페이지는 유지" && git push
```

## 검증 (배포 후 Cowork 라이브)
about/terms/privacy = 좁은 가운데 읽기 폭(모바일은 자동 full), 보드/종목은 넓은 폭 유지 — 역할별로 자연스럽게.
