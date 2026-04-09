export async function fetchNews(query?: string, country: string = 'KR') {
  const params = new URLSearchParams({ country });
  if (query) params.set('q', query);
  const res = await fetch(`/api/news?${params}`);
  return res.json();
}
