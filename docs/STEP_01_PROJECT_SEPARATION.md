# STEP 01 — Project Separation (Stock Terminal ↔ OTMarketing)

> 2026-04-23 · Cowork 설계 / Claude Code 실행

## 🔴 Opus 권장

**대규모 리팩토링 + 여러 폴더 간 판단 필요 + 복구 불가 위험성 있음**

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model opus
```

그 다음 Claude Code에게:
```
@docs/STEP_01_PROJECT_SEPARATION.md 파일 내용대로 실행해줘
```

---

## 🎯 목표

**현재 섞여있는 두 프로젝트를 완전 분리한다.**

- `~/Desktop/OTMarketing/` 내부에 Stock Terminal 코드(루트 Next.js 앱)와 CPA 사업 자산이 혼재
- Stock Terminal은 별도 폴더 `~/Desktop/stock-terminal/` 로 추출
- OTMarketing 폴더는 **CPA 사업 전용**으로 정리
- 외장하드(`/Volumes/soulmaten/주식 코인 채널 전용/Antigravity/`)의 ot-marketing.kr 사본은 GitHub 동기화 후 아카이브
- 두 프로젝트 간 공유 인프라·자산 기록을 `CROSS_REFERENCE.md` 에 명시

---

## 📦 전제 상태 (2026-04-23 현재)

현재 `~/Desktop/OTMarketing/` 구조:
```
OTMarketing/
├── [Stock Terminal 파일들 — 루트에 섞여있음]
│   ├── AGENTS.md
│   ├── CLAUDE.md (Stock Terminal 지침)
│   ├── CLAUDE_CODE_INSTRUCTIONS.md
│   ├── app/
│   ├── components/
│   ├── data/
│   ├── docs/ (Stock Terminal 문서)
│   ├── lib/
│   ├── public/
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── next-env.d.ts
│   ├── node_modules/
│   └── package-lock.json
│
├── [CPA 사업 자산 — 유지]
│   ├── ot-marketing-source/  (ot-marketing.kr 소스)
│   ├── templates/
│   │   └── proposals/  (제안서 6종 + 제너레이터)
│   └── OT_MARKETING_운영제안서_뉴스타트브릿지.pdf (루트에 놓여있음 → 이동 필요)
│
└── [잡파일]
    └── ot-marketing-2026 vervel Source.json (Vercel API 응답 파일, 삭제 가능)
```

외장하드:
```
/Volumes/soulmaten/주식 코인 채널 전용/Antigravity/
  → ot-marketing.kr 의 또 다른 사본 (GitHub 원본과 동기화 상태 확인 필요)
```

---

## ⚠️ 위험 요소 및 안전장치

1. **데이터 유실 방지**: 이동 전에 반드시 백업 생성 (타임스탬프 폴더)
2. **git 히스토리 보존**: 파일 이동은 `cp -a` (메타데이터 보존) 사용, `mv` 사용하는 경우만 같은 디스크 내
3. **외장하드 작업은 읽기만**: 원본은 건드리지 않고 동기화 확인 후 이름만 변경 (_archived_)
4. **Stock Terminal git 히스토리**: 만약 `~/Desktop/OTMarketing/.git` 이 Stock Terminal 커밋이면 해당 `.git` 폴더를 stock-terminal/ 로 함께 이동

---

## 🚀 실행 단계

### STEP 1. 현 상태 조사 (READ ONLY)
```bash
echo "━━━ [1] Desktop 현황 ━━━"
ls -la ~/Desktop/ | grep -iE "stock|market|anti" || echo "관련 폴더 없음"

echo ""
echo "━━━ [2] OTMarketing 루트 ━━━"
ls -la ~/Desktop/OTMarketing/

echo ""
echo "━━━ [3] OTMarketing 내 git 저장소 위치 ━━━"
find ~/Desktop/OTMarketing -name ".git" -type d 2>/dev/null | head -10

echo ""
echo "━━━ [4] OTMarketing 루트 git 정보 ━━━"
cd ~/Desktop/OTMarketing && git remote -v 2>/dev/null && git log --oneline | head -5 2>/dev/null || echo "git 저장소 아님"

echo ""
echo "━━━ [5] ot-marketing-source git 정보 ━━━"
cd ~/Desktop/OTMarketing/ot-marketing-source && git remote -v 2>/dev/null && git log --oneline | head -5 2>/dev/null || echo "git 저장소 아님"

echo ""
echo "━━━ [6] 외장하드 Antigravity 상태 ━━━"
if [ -d "/Volumes/soulmaten/주식 코인 채널 전용/Antigravity" ]; then
    ls "/Volumes/soulmaten/주식 코인 채널 전용/Antigravity/" | head -10
    cd "/Volumes/soulmaten/주식 코인 채널 전용/Antigravity" && git status 2>/dev/null | head -5
    cd "/Volumes/soulmaten/주식 코인 채널 전용/Antigravity" && git log --oneline 2>/dev/null | head -5
else
    echo "외장하드 미연결 또는 경로 변경됨 — 사용자 확인 필요"
fi
```

**→ 조사 결과를 보고받은 뒤 STEP 2부터 진행. 예상 밖 상황 발견 시 중단하고 Cowork에게 보고할 것.**

---

### STEP 2. 전체 백업 (안전장치)
```bash
BACKUP_DIR=~/Desktop/_BACKUP_$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# OTMarketing 전체 백업 (node_modules 제외)
rsync -a --exclude='node_modules' ~/Desktop/OTMarketing/ $BACKUP_DIR/OTMarketing/

echo "✅ 백업 완료: $BACKUP_DIR"
du -sh $BACKUP_DIR
```

---

### STEP 3. Stock Terminal 새 폴더로 추출

```bash
# 새 폴더 생성
mkdir -p ~/Desktop/stock-terminal

# Stock Terminal 파일들만 선별 이동
cd ~/Desktop/OTMarketing

# 루트 Next.js 앱 파일·폴더 이동
for item in app components data lib public docs AGENTS.md CLAUDE.md CLAUDE_CODE_INSTRUCTIONS.md README.md next.config.ts tsconfig.json eslint.config.mjs postcss.config.mjs next-env.d.ts package.json package-lock.json; do
    if [ -e "$item" ]; then
        mv "$item" ~/Desktop/stock-terminal/
        echo "✓ 이동: $item"
    fi
done

# node_modules 는 재설치 예정이므로 삭제
rm -rf ~/Desktop/OTMarketing/node_modules

# .git 폴더가 Stock Terminal 커밋 히스토리인지 확인 후 이동
# (STEP 1 조사 결과 기반 판단)
# 만약 ~/Desktop/OTMarketing/.git 이 Stock Terminal 커밋이라면:
# mv ~/Desktop/OTMarketing/.git ~/Desktop/stock-terminal/

echo ""
echo "━━━ Stock Terminal 이전 완료 ━━━"
ls ~/Desktop/stock-terminal/
```

**판단 필요**: `~/Desktop/OTMarketing/.git` 의 remote 가 Stock Terminal 저장소면 함께 이동. 만약 OTMarketing 용이면 그대로 유지.

---

### STEP 4. OTMarketing 폴더 정리

```bash
cd ~/Desktop/OTMarketing

# 루트에 놓여있던 PDF를 제안서 폴더로 이동
if [ -f "OT_MARKETING_운영제안서_뉴스타트브릿지.pdf" ]; then
    mkdir -p templates/proposals/sent
    mv "OT_MARKETING_운영제안서_뉴스타트브릿지.pdf" templates/proposals/sent/
    echo "✓ 발송된 제안서 보관: templates/proposals/sent/"
fi

# Vercel 응답 파일 아카이브
if [ -f "ot-marketing-2026 vervel Source.json" ]; then
    mkdir -p docs/archive
    mv "ot-marketing-2026 vervel Source.json" docs/archive/
    echo "✓ Vercel 응답 파일 아카이브"
fi

# 새 폴더 구조 생성
mkdir -p landings/{01-debt-relief,02-rental-water,03-broadband,04-invest-lead,05-realestate,06-medical}
mkdir -p scripts contracts docs

echo ""
echo "━━━ OTMarketing 정리 후 구조 ━━━"
ls -la ~/Desktop/OTMarketing/
```

---

### STEP 5. 외장하드 ot-marketing.kr 처리

```bash
EXT_DRIVE="/Volumes/soulmaten/주식 코인 채널 전용/Antigravity"

if [ -d "$EXT_DRIVE" ]; then
    cd "$EXT_DRIVE"
    
    # 외장하드 미커밋 변경사항 확인
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
    
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "⚠️  외장하드에 미커밋 변경사항 있음 — 수동 처리 필요"
        git status
        echo "👉 사용자에게 보고 후 중단"
        exit 1
    fi
    
    # 외장하드 → GitHub 최신 확인
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "⚠️  외장하드와 원격 저장소 HEAD 불일치"
        echo "LOCAL:  $LOCAL"
        echo "REMOTE: $REMOTE"
        echo "👉 사용자에게 보고 후 중단"
        exit 1
    fi
    
    # Desktop ot-marketing-source 를 GitHub 최신으로 동기화
    cd ~/Desktop/OTMarketing/ot-marketing-source
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
    
    echo "✅ Desktop ot-marketing-source 를 GitHub 최신과 동기화 완료"
    
    # 외장하드 폴더 이름 변경 (삭제하지 않음 — 수동 확인 후 삭제)
    cd "/Volumes/soulmaten/주식 코인 채널 전용"
    mv Antigravity "_archived_Antigravity_$(date +%Y%m%d)"
    echo "✅ 외장하드 원본 이름 변경 → _archived_Antigravity_YYYYMMDD"
    echo "   (1주일 뒤 수동 삭제 권장)"
else
    echo "⚠️  외장하드 미연결 — STEP 5 건너뜀"
fi
```

---

### STEP 6. OTMarketing 전용 문서 작성

#### 6-1. 새 CLAUDE.md (CPA 사업 전용)
```bash
cat > ~/Desktop/OTMarketing/CLAUDE.md <<'EOF'
# OTMarketing — Claude Code 지침서

> 2026-04-23 · CPA 사업 전담 프로젝트

## 프로젝트 개요
**OT MARKETING CPA 사업 종합 작업 공간**
- B2B 광고주 모집 사이트 운영 (ot-marketing.kr)
- 업종별 소비자 랜딩 페이지 제작·운영
- 제안서·계약서·스크립트 표준화 템플릿
- 광고주 온보딩 → DB 수집 → 1차콜 → 정산 파이프라인

## 폴더 구조
```
OTMarketing/
├── ot-marketing-source/  # B2B 광고주 모집 사이트 (ot-marketing.kr)
├── templates/
│   ├── proposals/        # 제안서 (업종 6종 + 제너레이터)
│   └── proposals/sent/   # 발송 완료 제안서 아카이브
├── landings/             # CPA 소비자 랜딩 (업종 6종)
│   ├── 01-debt-relief/   # 개인회생
│   ├── 02-rental-water/  # 정수기·렌탈
│   ├── 03-broadband/     # 인터넷·통신
│   ├── 04-invest-lead/   # 주식·코인 리딩
│   ├── 05-realestate/    # 부동산·분양
│   └── 06-medical/       # 병의원
├── scripts/              # 상담 콜 스크립트 (업종별)
├── contracts/            # 표준 계약서 (CPA·NDA)
└── docs/                 # 로드맵·단계별 명령·회의록
```

## 절대 규칙
- Stock Terminal 작업은 여기서 하지 않는다 → `~/Desktop/stock-terminal/`
- 각 랜딩은 독립 Next.js 프로젝트 (자체 package.json)
- 랜딩 배포는 업종별로 별도 Vercel 프로젝트 + 별도 도메인
- 광고주 DB는 구글 스프레드시트로 공통 관리 (Supabase 아님)
- 코딩 초보자 대상 — 명령어는 복붙 가능하게

## 역할 분담
- Cowork = 두뇌 (설계·템플릿 작성·카피 기획)
- Claude Code = 손 (코드 실행·빌드·git push·배포)

## 명령어 전달
- 3단계 이상 작업 → `docs/STEP_N_COMMAND.md` 파일로 전달
- 단순 1~2파일 수정 → 인라인 코드 블록

## 문서 업데이트 규칙
코드 작업 완료 시 반드시:
1. `CLAUDE.md` 헤더 날짜 갱신
2. `docs/CHANGELOG.md` 세션 변경사항 추가
3. `docs/NEXT_SESSION_START.md` 최신화

## 참조 파일
| 파일 | 용도 |
|------|------|
| `docs/CROSS_REFERENCE.md` | Stock Terminal 과의 공유 인프라 기록 |
| `docs/NEXT_SESSION_START.md` | 새 세션 시작 시 맥락 복구 |
| `docs/ROADMAP.md` | 주차별 CPA 사업 로드맵 |
| `templates/proposals/README.md` | 제안서 생성기 사용법 |
EOF
echo "✅ CLAUDE.md 작성"
```

#### 6-2. CROSS_REFERENCE.md
```bash
cat > ~/Desktop/OTMarketing/docs/CROSS_REFERENCE.md <<'EOF'
# Cross-Reference — OTMarketing ↔ Stock Terminal

> 2026-04-23 분리 시점 기록

## 📍 프로젝트 위치

| 프로젝트 | 위치 | 도메인 | 타겟 |
|---|---|---|---|
| OTMarketing (CPA 사업) | `~/Desktop/OTMarketing/` | ot-marketing.kr + 업종별 | B2B + B2C |
| Stock Terminal (투자 플랫폼) | `~/Desktop/stock-terminal/` | 미정 | B2C |

## 🔗 공유 인프라 (계정 1개, 저장소 2개)

| 자원 | 누가 관리 | 용도 |
|------|---------|------|
| Vercel 계정 | 공용 | 둘 다 여기서 배포 (프로젝트만 분리) |
| GitHub 계정 (soulmaten7) | 공용 | 저장소만 분리 (OT-MARKETING / stock-terminal) |
| Google Drive | 공용 | 자료·시트 저장 |
| 구글 스프레드시트 (광고주 DB) | OTMarketing | Stock Terminal은 사용 안 함 |
| Supabase (회원·인증) | Stock Terminal 전용 | OTMarketing은 사용 안 함 |

## 🎁 OTMarketing 에서 Stock Terminal 로 이식 가능 자산

Stock Terminal 이 "Partner-Agnostic Lead Gen" 수익모델로 확장할 때 재사용 가능한 OTMarketing 자산:

1. **제안서 제너레이터** (`templates/proposals/_generator.py`)
   - Python 기반 PDF 생성
   - Stock Terminal 파트너사 제안서에도 사용 가능

2. **업종 분류 체계** (`templates/proposals/_generator.py` INDUSTRIES dict)
   - 6개 업종 리드 정의 표준화
   - Stock Terminal 이 광고 파트너 분류할 때 참고

3. **랜딩 페이지 구조 패턴** (`landings/01-debt-relief/`)
   - 자가진단형 폼 + 리드 수집
   - Stock Terminal 의 CPA 배너 클릭 후 랜딩 경로에 재사용 가능

4. **상담 스크립트 프레임워크** (`scripts/`)
   - 1차콜 → DB 인정 기준
   - Stock Terminal 의 고객 지원 스크립트 기초로 활용 가능

5. **CPA 표준 계약서** (`contracts/`)
   - 단가·선입금·정산주기 조항
   - Stock Terminal 이 광고주와 직접 계약할 때 재사용

## ⛔ 절대 공유하지 않는 것

- **코드 저장소**: 각자 독립 git, cross-commit 금지
- **배포 파이프라인**: Vercel 프로젝트 각자 분리
- **도메인**: 완전 분리 (ot-marketing.kr 계열 ↔ stock-terminal 도메인)
- **node_modules**: 각자 재설치

## 📝 히스토리

- 2026-04-23: 분리 시점 — 이전까지 ~/Desktop/OTMarketing/ 한 폴더에 Stock Terminal 루트 + CPA 템플릿 혼재
- STEP_01_PROJECT_SEPARATION.md 실행으로 완전 분리
EOF
echo "✅ CROSS_REFERENCE.md 작성"
```

#### 6-3. NEXT_SESSION_START.md
```bash
cat > ~/Desktop/OTMarketing/docs/NEXT_SESSION_START.md <<'EOF'
# NEXT SESSION START — OTMarketing

> 2026-04-23 기준

## 🎯 이 프로젝트는?

**OT MARKETING CPA 사업 전담 공간**
- B2B: ot-marketing.kr (광고주 모집)
- B2C: 업종별 CPA 랜딩 6종 (개인회생·정수기·통신·투자·분양·병의원)
- 운영: 제안서·계약서·콜 스크립트 템플릿화

## 🏁 다음 세션에서 바로 할 일 (P0)

### 1. 상담 스크립트 템플릿 6종 (docx)
- Cowork 이 15분 내 제작
- `scripts/` 폴더에 저장

### 2. 개인회생 랜딩 v0
- `landings/01-debt-relief/` 에 Next.js 프로젝트 셋업
- 도메인: `newpath.kr` (또는 사장님 구매한 것)
- Claude Code 실행 명령: 별도 STEP_02 파일 예정

### 3. CPA 표준계약서
- `contracts/CPA_표준계약서.docx`
- 단가/선입금/정산주기 플레이스홀더

### 4. 진행 로드맵 엑셀
- `docs/ROADMAP.xlsx`
- 주차별 액션 + 담당 + 상태

## 📦 현재 완성된 자산

- [x] 제안서 템플릿 시스템 (`templates/proposals/`)
  - Python 제너레이터 + 업종 6종 PDF + Word 마스터
- [x] 뉴스타트브릿지 광고주용 맞춤 제안서 (발송 완료)
- [x] 운영 제안서 V4 콘텐츠 확정
- [x] 프로젝트 분리 (Stock Terminal 과 완전 분리)

## 📋 TODO (우선순위)

- [ ] 도메인 6개 구매 (newpath.kr / first-step.kr / goodstart.kr / smart-check.kr / quick-guide.kr / easy-start.kr)
- [ ] 상담 스크립트 6종 작성
- [ ] 개인회생 랜딩 v0 (뉴스타트브릿지 전용)
- [ ] 메타 광고계정 세팅
- [ ] 당근 광고 계정 세팅
- [ ] 구글 스프레드시트 DB 자동화 (텔레그램 알림 포함)
- [ ] 1주 테스트 실행 및 결과 진단

## 🔗 관련 문서

- `CLAUDE.md` — 프로젝트 지침
- `docs/CROSS_REFERENCE.md` — Stock Terminal 과의 관계
- `docs/STEP_01_PROJECT_SEPARATION.md` — 이 분리 작업의 명령서
- `templates/proposals/README.md` — 제안서 생성기 사용법

## 🌐 외부 자원

- GitHub: `soulmaten7/OT-MARKETING` (ot-marketing-source 원격)
- Vercel: `ot-marketing.kr` 배포
- 구글 시트: (DB 스프레드시트 링크 — 사장님 확인 필요)
- 가비아: 도메인 관리 (구매 진행 중)
EOF
echo "✅ NEXT_SESSION_START.md 작성"
```

#### 6-4. 루트 README.md
```bash
cat > ~/Desktop/OTMarketing/README.md <<'EOF'
# OTMarketing — CPA 사업 종합 작업 공간

**B2B 광고주 모집 + B2C 업종별 랜딩 + 운영 자동화**

## 빠른 시작

```bash
# 새 제안서 생성
cd templates/proposals
python _generator.py --industry debt-relief --company "회사명"

# 랜딩 페이지 로컬 실행
cd landings/01-debt-relief
npm install && npm run dev
```

## 구조

- `ot-marketing-source/` — B2B 광고주 모집 사이트
- `templates/` — 제안서·계약서 템플릿
- `landings/` — 업종별 소비자 랜딩 (각자 독립 Next.js)
- `scripts/` — 콜 상담 스크립트
- `contracts/` — 표준 계약서
- `docs/` — 로드맵·가이드·명령서

자세한 내용은 `CLAUDE.md` 참고.
EOF
echo "✅ README.md 작성"
```

---

### STEP 7. git 정리

```bash
cd ~/Desktop/OTMarketing

# OTMarketing 루트가 git 저장소가 아니라면 새로 초기화
if [ ! -d ".git" ]; then
    git init
    cat > .gitignore <<'EOF'
node_modules/
.env.local
.env
.DS_Store
*.log
.next/
.vercel/
.turbo/
out/
dist/
EOF
    git add .
    git commit -m "feat: initial OTMarketing project structure

- Separated from Stock Terminal (previously mixed in same folder)
- Created modular structure: ot-marketing-source/, templates/, landings/, scripts/, contracts/, docs/
- Documented cross-reference with Stock Terminal project
- Proposal template system (6 industries + generator)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
fi

echo ""
echo "━━━ git 상태 ━━━"
git log --oneline | head -3

# Stock Terminal git도 정리 (이동된 파일이 있다면)
cd ~/Desktop/stock-terminal
if [ -d ".git" ]; then
    git status
    echo "👉 Stock Terminal git 상태는 사용자 확인 필요"
fi
```

---

### STEP 8. 빌드 검증

```bash
# ot-marketing-source 빌드 테스트
cd ~/Desktop/OTMarketing/ot-marketing-source
npm install --silent
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ot-marketing-source 빌드 실패"
    exit 1
fi
echo "✅ ot-marketing-source 빌드 성공"

# Stock Terminal 빌드 테스트 (선택)
cd ~/Desktop/stock-terminal
if [ -f "package.json" ]; then
    npm install --silent
    npm run build
    if [ $? -ne 0 ]; then
        echo "⚠️ Stock Terminal 빌드 실패 — 별도 조치 필요"
    else
        echo "✅ Stock Terminal 빌드 성공"
    fi
fi
```

---

### STEP 9. 최종 보고

Claude Code는 다음 항목을 사용자에게 요약 보고:

1. OTMarketing/ 최종 구조 (`tree -L 2 ~/Desktop/OTMarketing/` 또는 `ls -la`)
2. Stock Terminal/ 최종 구조
3. 외장하드 상태 (아카이브 여부)
4. 백업 위치 (`~/Desktop/_BACKUP_YYYYMMDD_HHMMSS`)
5. 빌드 결과 (두 프로젝트 각각)
6. 다음 세션 진입 가이드

---

## ✅ 검증 체크리스트

실행 완료 후 다음 모두 만족해야 함:

- [ ] `~/Desktop/stock-terminal/` 에 Stock Terminal Next.js 앱 존재
- [ ] `~/Desktop/stock-terminal/CLAUDE.md` (기존 Stock Terminal 지침서) 이동됨
- [ ] `~/Desktop/OTMarketing/` 루트에 Next.js 파일 없음 (app/, components/, lib/ 등)
- [ ] `~/Desktop/OTMarketing/ot-marketing-source/` 정상 존재 + git 히스토리 유지
- [ ] `~/Desktop/OTMarketing/templates/proposals/` 9개 파일 유지 (제안서 6종 + 제너레이터 + docx + README)
- [ ] `~/Desktop/OTMarketing/{landings,scripts,contracts,docs}/` 생성됨
- [ ] `~/Desktop/OTMarketing/CLAUDE.md` (신규, CPA 사업용) 작성됨
- [ ] `~/Desktop/OTMarketing/docs/CROSS_REFERENCE.md` 작성됨
- [ ] `~/Desktop/OTMarketing/docs/NEXT_SESSION_START.md` 작성됨
- [ ] `~/Desktop/OTMarketing/README.md` (신규 루트) 작성됨
- [ ] 외장하드 `Antigravity/` → `_archived_Antigravity_YYYYMMDD/` 이름 변경됨
- [ ] 백업 폴더 `~/Desktop/_BACKUP_YYYYMMDD_HHMMSS/` 존재
- [ ] `ot-marketing-source` `npm run build` 성공
- [ ] 두 프로젝트의 `.git` 폴더 각자 정상 (remote 정상)

---

## 🔙 실패 시 롤백

문제 발생 시:
```bash
# 백업에서 복원
BACKUP_DIR=$(ls -td ~/Desktop/_BACKUP_* | head -1)
rm -rf ~/Desktop/OTMarketing_broken
mv ~/Desktop/OTMarketing ~/Desktop/OTMarketing_broken
cp -a $BACKUP_DIR/OTMarketing ~/Desktop/OTMarketing
echo "복원 완료 — 백업에서 되돌림"

# 새로 만든 stock-terminal 은 그대로 두거나 삭제
# (사용자 판단)
```

---

## 🎬 완료 후 사장님 할 일

1. **Cowork 새 세션 열기** → OTMarketing 폴더 선택
2. 새 세션에서 "다음 세션 시작 가이드 읽어줘" 요청 → NEXT_SESSION_START.md 로드
3. 기존 세션(Stock Terminal) 은 그대로 두고, 필요할 때 새 창으로 stock-terminal 폴더 선택
4. 1주 뒤 백업 폴더 `~/Desktop/_BACKUP_*` 삭제 (문제 없으면)

---

## 커밋 메시지 (OTMarketing 루트)

```
feat: separate OTMarketing (CPA business) from Stock Terminal

Previously Stock Terminal code and CPA business assets coexisted in
~/Desktop/OTMarketing/. This commit represents the clean slate for
OTMarketing as a dedicated CPA business workspace.

Structure:
- ot-marketing-source/ : B2B advertiser acquisition site
- templates/ : Proposal and contract templates
- landings/ : 6 industry-specific consumer CPA landings
- scripts/ : Call center scripts
- contracts/ : Standard CPA contracts
- docs/ : Roadmap and cross-reference

Stock Terminal code moved to: ~/Desktop/stock-terminal/
External drive legacy copy archived: _archived_Antigravity_YYYYMMDD

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

---

## 📞 문제 발생 시

- **Stock Terminal 빌드 깨짐** → 백업에서 해당 부분만 복원
- **ot-marketing-source git 히스토리 손실** → GitHub 에서 다시 clone
- **외장하드 미연결** → STEP 5 건너뛰고 나중에 별도 처리
- **권한 에러** → `chmod -R u+rw ~/Desktop/OTMarketing/` 후 재시도

→ 해결 안 될 경우 Cowork 에게 상황 보고 후 대기
