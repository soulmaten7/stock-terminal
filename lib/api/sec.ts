export async function fetchSecFilings(ticker: string) {
  const res = await fetch(`/api/sec?ticker=${ticker}&type=filings`);
  return res.json();
}

export async function fetchSecCompany(ticker: string) {
  const res = await fetch(`/api/sec?ticker=${ticker}&type=company`);
  return res.json();
}
