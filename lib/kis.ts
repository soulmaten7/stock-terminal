const KIS_BASE_URL = process.env.KIS_BASE_URL || 'https://openapi.koreainvestment.com:9443';
const KIS_APP_KEY = process.env.KIS_APP_KEY || '';
const KIS_APP_SECRET = process.env.KIS_APP_SECRET || '';
const RATE_LIMIT_MS = parseInt(process.env.KIS_RATE_LIMIT_MS || '400', 10);

// ── Token cache ─────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getKisToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

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
  // token_token_expired format: "2026-04-10 12:00:00" KST — parse it
  if (data.token_token_expired) {
    const exp = new Date(data.token_token_expired + '+09:00');
    tokenExpiresAt = exp.getTime() - 60_000; // 1분 여유
  } else {
    tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000; // fallback: 23시간
  }

  return cachedToken!;
}

// ── Rate limiter (simple queue) ─────────────────────────────────────────────

let lastCallTime = 0;

async function rateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastCallTime = Date.now();
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
