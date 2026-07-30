// Search-link builders only — no scraping or automated fetching of these sites.
// The admin clicks through and manually records what they find via addCompetitorPrice.
export function buildSearchLinks(query: string) {
  const q = encodeURIComponent(query);
  return [
    { label: "네이버쇼핑", url: `https://search.shopping.naver.com/search/all?query=${q}` },
    { label: "쿠팡", url: `https://www.coupang.com/np/search?q=${q}` },
    { label: "지그재그", url: `https://zigzag.kr/search?keyword=${q}` },
    { label: "11번가", url: `https://search.11st.co.kr/pc/search.tmall?kwd=${q}` },
    { label: "구글 쇼핑", url: `https://www.google.com/search?tbm=shop&q=${q}` },
  ];
}
