<!-- 2026-07-06 -->
# STEP 624 — 베트남 종목 유니버스 + 베트남어명 확보 (vnstock 덤프)

> **목표(데이터 먼저)**: `data/vn_symbols.json` 생성 = HOSE·HNX 전 종목 `[{sym:'VIC.VN', name:'베트남어명', market:'hose'|'hnx'}]`. 이게 있어야 다음 STEP에서 종목보드·수익률 크론·R3 이름이 붙음.
> **왜 vnstock**: 야후 .VN은 개별 시세는 되지만 '전 종목 리스트'를 안 줌. VCI/TCBS 직접 API는 자주 바뀜 → **vnstock(유지되는 파이썬 래퍼)**로 HOSE/HNX 티커+베트남어 organ_name을 한 번에. 유저 머신(KR)은 VN 데이터 백엔드 도달됨.
> **이 STEP은 데이터 덤프만** — DB 반영·보드 컴포넌트는 다음. **커밋도 다음 STEP에서**(먼저 vn_symbols.json 눈검수).
> **전제**: STEP 623(`38e38bb`) 이후.
> 🔴 실행: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`

## 1) vnstock 설치 + 유니버스 덤프
```bash
cd ~/stock-terminal
pip install -U vnstock --break-system-packages 2>&1 | tail -2
python3 - <<'PY'
import json, sys, os
os.chdir(os.path.expanduser('~/stock-terminal'))
try:
    from vnstock import Listing
    L = Listing()
except Exception as e:
    print('IMPORT_FAIL', repr(e)); sys.exit(1)

df = None
for fn in ['symbols_by_exchange', 'all_symbols']:
    try:
        df = getattr(L, fn)()
        print('OK', fn, '| cols=', list(df.columns), '| rows=', len(df))
        break
    except Exception as e:
        print('FAIL', fn, repr(e))
if df is None:
    print('NO_LISTING_API'); sys.exit(1)

cols = {c.lower(): c for c in df.columns}
def col(*names):
    for n in names:
        if n in cols: return cols[n]
    return None
c_sym = col('symbol','ticker')
c_ex  = col('exchange','comgroupcode','board','group_code')
c_nm  = col('organ_name','organname','organ_short_name','organshortname','company_name','short_name')
print('MAP sym=',c_sym,'ex=',c_ex,'nm=',c_nm)
if not c_sym:
    print('NO_SYMBOL_COL — df.head:', df.head(3).to_dict('records')); sys.exit(1)

rows=[]
for _,r in df.iterrows():
    sym=str(r[c_sym]).strip().upper()
    ex=(str(r[c_ex]).strip().upper() if c_ex else '')
    nm=(str(r[c_nm]).strip() if c_nm else '')
    if len(sym)!=3 or not sym.isalpha(): continue          # HOSE/HNX 보통주 = 3글자 알파
    if 'HSX' in ex or 'HOSE' in ex: mk='hose'
    elif 'HNX' in ex: mk='hnx'
    else: continue                                          # UPCOM 등 MVP 제외
    rows.append({'sym':sym+'.VN','name':(nm or sym),'market':mk})

seen=set(); uniq=[]
for x in rows:
    if x['sym'] in seen: continue
    seen.add(x['sym']); uniq.append(x)
json.dump(uniq, open('data/vn_symbols.json','w'), ensure_ascii=False)
print('WROTE data/vn_symbols.json  총', len(uniq), '| HOSE', sum(1 for x in uniq if x['market']=='hose'), '| HNX', sum(1 for x in uniq if x['market']=='hnx'))
for s in ['VIC.VN','VNM.VN','VCB.VN','HPG.VN','FPT.VN','MWG.VN','TCB.VN']:
    m=[x for x in uniq if x['sym']==s]
    print(' ', s, '→', (m[0]['name'] if m else '❌MISSING'))
PY
```

## 2) 판정
- ✅ **성공**: `WROTE ... 총 N` (N ≈ 600~1600) + VIC.VN→"...Vingroup...", VCB.VN→"...Ngoại thương..."(Vietcombank 베트남어), VNM.VN→"...Sữa Việt Nam..."(Vinamilk) 처럼 **베트남어 이름**이 뜨면 성공.
- ⚠️ `IMPORT_FAIL`/`NO_LISTING_API`/컬럼 매핑 실패면 — 출력의 `cols=`/`df.head`를 붙여줘. vnstock 버전별 API 차이(예: `Listing(source='VCI')`, 또는 `from vnstock import Vnstock`)라 컬럼명만 맞추면 됨. Sonnet이 출력 보고 조정 가능.

## 3) 결과 붙여넣기 → 멈춤
- **여기서 멈춤(커밋·DB X).** 위 출력(총 개수 + 7종목 이름 샘플) 붙여주면 → Cowork이 `vn_symbols.json` 실물 확인 + `vn_names` 테이블 시드(MCP) → STEP 625(VnMarketBoard 컴포넌트+크론+market 탭 배선) 발행.

## ✅ 이후: 유니버스 확정 → 야후 `.VN` 시세·수익률 크론(`vn_stock_perf`) + `VnMarketBoard`(JP/CN 보드 클론) → market 탭 Placeholder 교체.
