const KIS_BASE_URL = process.env.KIS_BASE_URL || 'https://openapi.koreainvestment.com:9443';
const KIS_APP_KEY = process.env.KIS_APP_KEY || '';
const KIS_APP_SECRET = process.env.KIS_APP_SECRET || '';
// 한투 실전계좌 첫 3영업일: 1건/초 제한 → 1100ms 여유
// 3영업일 이후: 20건/초까지 허용 → KIS_RATE_LIMIT_MS=60 으로 env 변경 가능
const RATE_LIMIT_MS = parseInt(process.env.KIS_RATE_LIMIT_MS || '1100', 10);

// ── Token cache ─────────────────────────────────────────────────────────────

// 한투 token API: 1분에 1회만 발급 가능
// 동시 요청이 들어와도 하나만 발급받고 공유하도록 pending promise 관리
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let pendingTokenPromise: Promise<string> | null = null;

// 파일시스템 토큰 캐시 (HMR 리로드 시에도 유지)
const TOKEN_CACHE_FILE = '/tmp/kis-token-cache.json';

async function loadTokenFromDisk(): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(TOKEN_CACHE_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data.token && data.expiresAt && Date.now() < data.expiresAt) {
      cachedToken = data.token;
      tokenExpiresAt = data.expiresAt;
    }
  } catch {
    // 파일 없거나 파싱 실패 — 무시
  }
}

async function saveTokenToDisk(token: string, expiresAt: number): Promise<void> {
  try {
    const fs = await import('fs/promises');
    await fs.writeFile(TOKEN_CACHE_FILE, JSON.stringify({ token, expiresAt }));
  } catch {
    // 쓰기 실패 — 무시 (메모리 캐시는 작동)
  }
}

export async function getKisToken(): Promise<string> {
  // 메모리 캐시 확인
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  // 디스크 캐시 확인 (HMR 리로드 대응)
  if (!cachedToken) {
    await loadTokenFromDisk();
    if (cachedToken && Date.now() < tokenExpiresAt) {
      return cachedToken;
    }
  }

  // 이미 발급 중이면 그걸 기다림
  if (pendingTokenPromise) {
    return pendingTokenPromise;
  }

  pendingTokenPromise = (async () => {
    try {
      const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: KIS_APP_KEY,
          appsecret: KIS_APP_SECRET,
        }),
      });

      if (!res.ok) {
        throw new Error(`KIS token error: ${res.status} ${await res.text()}`);
      }

      const data = await res.json();
      cachedToken = data.access_token;
      if (data.token_token_expired) {
        const exp = new Date(data.token_token_expired + '+09:00');
        tokenExpiresAt = exp.getTime() - 60_000;
      } else {
        tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
      }

      await saveTokenToDisk(cachedToken!, tokenExpiresAt);
      return cachedToken!;
    } finally {
      pendingTokenPromise = null;
    }
  })();

  return pendingTokenPromise;
}

// ── Rate limiter (serialized queue) ─────────────────────────────────────────
// 동시 요청이 들어와도 반드시 RATE_LIMIT_MS 간격으로 직렬 처리되도록
// Promise 체인으로 serialize

let queue: Promise<void> = Promise.resolve();
let lastCallTime = 0;

async function rateLimitWait(): Promise<void> {
  const prev = queue;
  let release!: () => void;
  queue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    const now = Date.now();
    const elapsed = now - lastCallTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
    }
    lastCallTime = Date.now();
  } finally {
    release();
  }
}

// ── Common API caller ───────────────────────────────────────────────────────

interface KisApiOptions {
  endpoint: string;
  trId: string;
  params?: Record<string, string>;
}

export async function fetchKisApi({ endpoint, trId, params }: KisApiOptions) {
  await rateLimitWait();

  const token = await getKisToken();

  const url = new URL(`${KIS_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      authorization: `Bearer ${token}`,
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
      tr_id: trId,
      custtype: 'P',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KIS API error [${trId}]: ${res.status} ${text}`);
  }

  return res.json();
}
