export async function fetchKrxSupplyDemand(date?: string) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  params.set('type', 'supply');
  const res = await fetch(`/api/krx?${params}`);
  return res.json();
}

export async function fetchKrxShortSelling(date?: string) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  params.set('type', 'short');
  const res = await fetch(`/api/krx?${params}`);
  return res.json();
}
