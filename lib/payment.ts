const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_BASE = 'https://api.tosspayments.com/v1';

function authHeader() {
  return 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
}

export async function issueBillingKey(authKey: string, customerKey: string) {
  const res = await fetch(`${TOSS_BASE}/billing/authorizations/issue`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey, customerKey }),
  });
  return res.json();
}

export async function chargeBilling(billingKey: string, customerKey: string, amount: number, orderId: string, orderName: string) {
  const res = await fetch(`${TOSS_BASE}/billing/${billingKey}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerKey, amount, orderId, orderName, taxFreeAmount: 0 }),
  });
  return res.json();
}

export async function cancelPayment(paymentKey: string, reason: string) {
  const res = await fetch(`${TOSS_BASE}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelReason: reason }),
  });
  return res.json();
}

export const PLANS = {
  free: { name: 'Free', price: 0, features: ['홈 1층', '뉴스·공시', '링크허브'] },
  premium: { name: 'Premium', price: 29000, features: ['모든 기능', '종목 상세', '시장분석', '스크리너', '비교'] },
  pro: { name: 'Pro', price: 49000, features: ['Premium 전부', 'AI분석 5종', '키워드 알림 무제한'] },
} as const;

export type PlanKey = keyof typeof PLANS;
