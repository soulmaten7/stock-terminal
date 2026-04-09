export async function fetchDartDisclosures(corpCode: string) {
  const res = await fetch(`/api/dart?endpoint=list&corp_code=${corpCode}&bgn_de=20240101&page_count=20`);
  return res.json();
}

export async function fetchDartFinancials(corpCode: string, bsnsYear: string, reprtCode: string = '11011') {
  const res = await fetch(`/api/dart?endpoint=fnlttSinglAcntAll&corp_code=${corpCode}&bsns_year=${bsnsYear}&reprt_code=${reprtCode}&fs_div=OFS`);
  return res.json();
}
