export function resolveChannel(input: {
  source: "website" | "manual" | string;
  utmSource: string;
  utmMedium: string;
  referrer: string;
}): string {
  if (input.source !== "website") return "직접 등록";

  const utm = input.utmSource.toLowerCase();
  if (utm) {
    if (utm.includes("instagram") || utm === "ig") return "인스타그램";
    if (utm.includes("naver") && input.utmMedium.toLowerCase().includes("blog")) return "네이버 블로그";
    if (utm.includes("naver")) return "네이버";
    if (utm.includes("youtube")) return "유튜브";
    if (utm.includes("google")) return "구글";
    if (utm.includes("kakao")) return "카카오";
    return input.utmSource;
  }

  const ref = input.referrer.toLowerCase();
  if (ref) {
    if (ref.includes("instagram.com")) return "인스타그램";
    if (ref.includes("blog.naver.com")) return "네이버 블로그";
    if (ref.includes("naver.com")) return "네이버";
    if (ref.includes("youtube.com") || ref.includes("youtu.be")) return "유튜브";
    if (ref.includes("google.")) return "구글 검색";
    if (ref.includes("daum.net") || ref.includes("kakao.com")) return "카카오/다음";
    return "기타 웹사이트";
  }

  return "직접 방문/URL 입력";
}
