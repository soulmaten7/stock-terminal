// STEP 987 §2 — 프로덕션 결측 349건 직접 조회 + 대조군 100건. 야후만 호출, DB 쓰기 0.
// 기존 topByMarketCap stage1 방식(배치100·동시성6) 그대로 재사용 — 로직 복제 아님, 같은 파라미터.
import fs from "fs";
import YahooFinance from "yahoo-finance2";
import { resolveMarketCap } from "../lib/marketCapReconstruct";

const STALE_349 = "AAP,AB,ACH,ACM,ADI,ADX,AEC,AEO,AFB,AFBI,AGD,AGO,AHT,AI,AIB,AIT,AIV,AMBO,AMC,AMG,AMH,AMS,AOD,AP,ARAI,ARL,AS,ASA,ASIC,ASR,ASTI,AVBP,AVD,AVK,AVX,AXIA,AZO,B,BBW,BBY,BDL,BGB,BGH,BHK,BHV,BKD,BKE,BLX,BME,BNZI,BOE,BOX,BRC,BSL,BST,BTO,BTZ,BUI,BVN,BWG,CABO,CAG,CBL,CCU,CEE,CET,CHW,CIG,CIK,CLX,CMC,CMP,COO,CPB,CRF,CRM,CRS,CSV,CVV,CX,CXM,CYD,CYN,DAC,DAL,DAR,DBL,DCI,DDS,DHT,DHY,DIT,DOX,DRD,DSS,DY,EA,EBF,ECC,EDD,EDF,EDN,EDSA,EDU,EE,EFT,EL,ELSE,EMD,EML,EMO,EOT,ERH,ESE,ESP,ETY,EU,EVG,EVV,EXG,EYE,FC,FCT,FLR,FLY,FN,FNV,FOF,FRA,FT,FTF,GAB,GAIN,GAP,GDL,GDO,GF,GFI,GGN,GGZ,GIS,GLO,GLQ,GLU,GO,GOF,GRX,GSL,GSM,GTN,GUT,GV,HD,HE,HEI,HEQ,HHS,HIO,HLX,HMY,HPQ,HQH,HQL,HRL,HST,IBN,ICL,IDT,IGA,IGC,IHD,IHT,IIF,IMO,IOT,IQI,ITT,JCE,JD,JFR,JHI,JOF,JQC,JRS,KAI,KBH,KEN,KFY,KMX,KOF,KR,KSS,KVAC,LBRDK,LEE,LGI,LND,LOW,LPRO,LSH,LTM,MANU,MCD,MCY,MDT,MGF,MGN,MHD,MIN,MMD,MOV,MRK,MRX,MSB,MSM,MU,MUJ,MWG,MXC,MYI,NAC,NAK,NAN,NAT,NAZ,NBB,NBH,NBN,NCA,NCT,NCV,NEA,NGL,NGS,NHI,NHS,NIO,NL,NMI,NMT,NNY,NOK,NOMD,NRP,NUE,NUS,NXP,ODC,OLN,ORC,ORLA,P,PAA,PBH,PBM,PC,PCM,PCN,PCQ,PDT,PED,PFL,PGC,PGP,PHI,PHK,PHM,PLG,PML,PMO,PMT,PNI,POM,PPL,PPT,PSTV,PVH,PZG,RCG,RFI,RGC,RGS,RGT,RIG,RMCO,RYN,SE,SFL,SID,SIF,SIG,SJT,SKK,SKYT,SNX,SNYR,SOR,SPG,SSD,SSL,SSP,STK,SVM,SWZ,TAL,TCX,TDS,TEO,TFX,TGT,THM,TOI,TOL,TR,TRP,TRT,TRX,TS,TTC,TX,TYG,UAN,UEC,UFI,UGP,URG,USA,UTF,UUU,VGZ,VHC,VIV,VKQ,VLT,VMO,VOC,VPV,VSEE,WDC,WDS,WEA,WEN,WIW,WMK,WWW,WYY,XOM,YRD,ZBIO".split(",");

const CONTROL_100 = "A,AA,AACB,AACG,AACI,AACO,AACP,AAL,AAME,AAMI,AAOI,AAON,AAPG,AAPL,AARD,AAT,AAUC,ABAT,ABBV,ABCB,ABCL,ABEO,ABEV,ABG,ABLV,ABM,ABNB,ABOS,ABR,ABSI,ABT,ABTC,ABTS,ABUS,ABVC,ABVX,ABX,ACA,ACAA,ACAD,ACB,ACCL,ACCO,ACCS,ACDC,ACEL,ACET,ACFN,ACGC,ACGL,ACHC,ACHR,ACHV,ACI,ACIC,ACIU,ACIW,ACLS,ACMR,ACN,ACNB,ACNT,ACOG,ACON,ACP,ACR,ACRE,ACRS,ACRV,ACT,ACTG,ACTU,ACU,ACV,ACVA,ACXP,AD,ADAC,ADAG,ADAM,ADBE,ADC,ADCT,ADEA,ADGM,ADIG,ADIL,ADM,ADMA,ADNT,ADP,ADPT,ADSE,ADSK,ADT,ADTN,ADUR,ADUS,ADV,ADVB".split(",");

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() { while (idx < arr.length) { const cur = idx++; out[cur] = await fn(arr[cur]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

type Row = { symbol: string; responded: boolean; hasMarketCap: boolean; hasShares: boolean; hasPrice: boolean; reconSource: string | null };

async function queryGroup(syms: string[], label: string): Promise<{ rows: Row[]; failedChunks: number; totalChunks: number }> {
  const chunks: string[][] = [];
  for (let i = 0; i < syms.length; i += 100) chunks.push(syms.slice(i, i + 100));
  const rows: Row[] = [];
  const responded = new Set<string>();
  let failedChunks = 0;
  await mapLimit(chunks, 6, async (grp) => {
    try {
      const qs = (await yf.quote(grp)) as Array<Record<string, unknown>>;
      for (const q of Array.isArray(qs) ? qs : []) {
        const sym = q.symbol as string | undefined;
        if (!sym) continue;
        responded.add(sym);
        const r = resolveMarketCap(q);
        rows.push({
          symbol: sym, responded: true,
          hasMarketCap: typeof q.marketCap === "number" && (q.marketCap as number) > 0,
          hasShares: typeof q.sharesOutstanding === "number" && (q.sharesOutstanding as number) > 0,
          hasPrice: typeof q.regularMarketPrice === "number" && (q.regularMarketPrice as number) > 0,
          reconSource: r.source,
        });
      }
    } catch (e) {
      failedChunks++;
      console.log(`[${label}] 청크 실패:`, e instanceof Error ? e.message : String(e));
    }
  });
  for (const sym of syms) {
    if (!responded.has(sym)) rows.push({ symbol: sym, responded: false, hasMarketCap: false, hasShares: false, hasPrice: false, reconSource: null });
  }
  return { rows, failedChunks, totalChunks: chunks.length };
}

async function main() {
  console.log(`대상: 결측349 + 대조군100`);
  const stale = await queryGroup(STALE_349, "stale349");
  const control = await queryGroup(CONTROL_100, "control100");

  const summarize = (rows: Row[]) => {
    const n = rows.length;
    const responded = rows.filter((r) => r.responded).length;
    const hasMarketCap = rows.filter((r) => r.hasMarketCap).length;
    const noMarketCap = rows.filter((r) => r.responded && !r.hasMarketCap);
    const reconstructableAmongNoMcap = noMarketCap.filter((r) => r.hasShares && r.hasPrice).length;
    const noReconEither = noMarketCap.filter((r) => !(r.hasShares && r.hasPrice)).length;
    return { n, responded, noResponse: n - responded, hasMarketCap, noMarketCapCount: noMarketCap.length, reconstructableAmongNoMcap, noReconEither };
  };

  const staleSummary = summarize(stale.rows);
  const controlSummary = summarize(control.rows);

  const result = {
    stale349: { ...staleSummary, failedChunks: stale.failedChunks, totalChunks: stale.totalChunks, rows: stale.rows },
    control100: { ...controlSummary, failedChunks: control.failedChunks, totalChunks: control.totalChunks, rows: control.rows },
  };
  fs.writeFileSync("docs/probe_987_yahoo_query_output.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ stale349: staleSummary, control100: controlSummary }, null, 2));
}

main();
