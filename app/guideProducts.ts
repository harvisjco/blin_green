// Curated curtain/blind product catalog, shared by the homepage guide and
// the in-person consultation portfolio (/portfolio).
export const guideProducts: {
  id: string;
  family: string;
  name: string;
  image: string;
  tags: string[];
  best: string;
  mood: string;
  control: string;
  privacy: string;
  care: string;
  note: string;
  caution: string;
  sourceUrl: string;
  sourceLabel: string;
}[] = [
  { id: "sheer", family: "커튼", name: "쉬폰 · 차르르 커튼", image: "https://changane.com/web/product/medium/202407/c2a4f301a52fcb8d928c38869f48acb3.jpg", tags: ["채광", "프라이버시"], best: "거실 · 안방", mood: "맑고 부드러운 호텔 무드", control: "빛을 부드럽게 걸러 들입니다", privacy: "낮에는 시선 완화, 밤에는 단독 사용보다 이중 구성을 권합니다", care: "먼지 관리가 쉽고, 원단별 세탁 방법은 확인이 필요합니다", note: "햇살의 결을 살리고 싶은 집", caution: "야간 프라이버시·암막이 중요하면 겉커튼을 함께 선택하세요.", sourceUrl: "https://changane.com/product/list.html?cate_no=28", sourceLabel: "창안애 도톰 쉬폰 커튼" },
  { id: "drape", family: "커튼", name: "린넨 · 패브릭 커튼", image: "https://changane.com/web/product/medium/202407/b8a9286cca109e7390e481d37aec2dfa.jpg", tags: ["프라이버시", "채광"], best: "거실 · 다이닝", mood: "내추럴하고 깊이 있는 질감", control: "원단 밀도에 따라 은은한 차광부터 안정적인 가림까지", privacy: "쉬폰보다 안정적이며, 원단 선택에 따라 달라집니다", care: "천연 소재 비율이 높을수록 질감과 구김의 매력이 함께 있습니다", note: "우드·베이지·내추럴 인테리어", caution: "질감과 주름, 세탁 가능 여부를 실물 원단으로 꼭 확인하세요.", sourceUrl: "https://changane.com/product/list.html?cate_no=28", sourceLabel: "창안애 린넨 쉬폰 커튼" },
  { id: "blackout", family: "커튼", name: "암막 커튼", image: "https://changane.com/web/product/medium/202407/a4276f335f1d88e31241887a03975f2d.jpg", tags: ["암막", "프라이버시"], best: "안방 · 아이방 · 미디어룸", mood: "차분하고 포근한 휴식 공간", control: "원단 등급과 설치 틈새에 따라 빛 차단 정도가 달라집니다", privacy: "강한 차단이 필요한 밤 시간에 적합합니다", care: "두꺼운 원단은 무게·레일 방식·세탁 방법을 함께 검토합니다", note: "숙면, 낮잠, 빔프로젝터", caution: "‘완전 암막’은 창 주변 틈·레일 구조까지 함께 설계해야 합니다.", sourceUrl: "https://changane.com/product/list.html?cate_no=28", sourceLabel: "창안애 오브리 100% 암막커튼" },
  { id: "double", family: "커튼", name: "이중 커튼", image: "https://changane.com/web/product/medium/202603/71d25931e63dce38240931d81f986066.jpg", tags: ["채광", "암막", "프라이버시"], best: "거실 · 안방", mood: "낮과 밤을 모두 갖는 완성형", control: "속커튼과 겉커튼을 따로 열고 닫아 상황별로 조절합니다", privacy: "낮에는 속커튼, 밤에는 겉커튼으로 유연하게 대응합니다", care: "레일 두 줄과 커튼 박스 깊이를 실측에서 확인합니다", note: "예쁜 채광과 숙면을 모두 원하는 집", caution: "창 앞 가구와 레일 공간이 충분한지 먼저 보세요.", sourceUrl: "https://changane.com/product/list.html?cate_no=28", sourceLabel: "창안애 스마트 암막커튼" },
  { id: "combi", family: "블라인드", name: "콤비 블라인드", image: "https://changane.com/web/product/medium/202204/ea99ba49f9cb9bf6afd9784f36cb393e.jpg", tags: ["채광", "깔끔함", "프라이버시"], best: "아이방 · 서재 · 작은 창", mood: "가볍고 정돈된 모던함", control: "원단과 망사 줄무늬를 겹치며 내린 상태에서도 빛을 조절합니다", privacy: "반개방 상태에서 시선과 채광을 함께 조절하기 좋습니다", care: "먼지 제거가 편한 편이나, 체인·원단 손상은 점검이 필요합니다", note: "매일 빛 조절을 자주 하는 공간", caution: "완전 암막 수준은 원단 등급과 측면 틈을 확인하세요.", sourceUrl: "https://changane.com/category/%EB%B8%94%EB%9D%BC%EC%9D%B8%EB%93%9C/43/", sourceLabel: "창안애 우드룩 콤비블라인드" },
  { id: "roller", family: "블라인드", name: "롤스크린", image: "https://changane.com/web/product/medium/202204/48c8adb774c0b5a8642805d242ebcc06.jpg", tags: ["깔끔함", "암막"], best: "서재 · 주방 · 작은 창", mood: "평면적이고 미니멀한 인상", control: "한 장의 원단을 위아래로 올리고 내려 빛을 조절합니다", privacy: "필요할 때 확실히 내리는 사용 방식에 적합합니다", care: "평평한 원단이라 관리가 간단하고 공간을 덜 차지합니다", note: "군더더기 없는 창 정리", caution: "내린 상태에서 미세 채광 조절은 콤비보다 제한적입니다.", sourceUrl: "https://changane.com/product/list.html?cate_no=27", sourceLabel: "창안애 시그니처 문달 롤스크린" },
  { id: "wood", family: "블라인드", name: "우드 · 폴리우드 블라인드", image: "https://changane.com/web/product/small/202203/5420b61ccd9e151825b6543208d99527.jpg", tags: ["채광", "프라이버시"], best: "거실 · 발코니 · 다이닝", mood: "나무의 온도가 느껴지는 홈카페 무드", control: "슬랫 각도를 조절해 빛의 방향을 섬세하게 다룹니다", privacy: "슬랫을 기울여 시선은 줄이고 빛은 남길 수 있습니다", care: "원목·폴리우드 등 소재별 무게와 습기 대응을 비교합니다", note: "우드 가구·내추럴 톤을 좋아하는 집", caution: "큰 창은 무게와 분할 방식, 창문 개폐 간섭을 실측해야 합니다.", sourceUrl: "https://changane.com/category/%EB%B8%94%EB%9D%BC%EC%9D%B8%EB%93%9C/43/", sourceLabel: "창안애 오동나무 우드블라인드" },
  { id: "honeycomb", family: "블라인드", name: "허니콤 쉐이드", image: "https://changane.com/web/product/medium/202204/638bfe7253d74c6c0271f67d95a388e3.jpg", tags: ["단열", "암막", "깔끔함"], best: "안방 · 아이방 · 단열이 필요한 창", mood: "가볍고 포근한 정돈감", control: "벌집 구조의 셀을 접고 펴며 부드럽게 올리고 내립니다", privacy: "상·하단 개방형 등 구조에 따라 채광과 가림을 조절할 수 있습니다", care: "셀 안쪽 먼지와 주름 손상에 유의해 부드럽게 관리합니다", note: "여름 열기·겨울 냉기 완화도 함께 고민할 때", caution: "단열 성능과 암막성은 셀 구조·원단·설치 틈에 따라 달라집니다.", sourceUrl: "https://changane.com/category/%EB%B8%94%EB%9D%BC%EC%9D%B8%EB%93%9C/43/", sourceLabel: "창안애 허니콤블라인드 쉐이드" },
  { id: "vertical", family: "블라인드", name: "버티컬 블라인드", image: "https://changane.com/web/product/medium/202204/0800cc7e2172bca008f998be347efe7f.jpg", tags: ["넓은 창", "채광", "깔끔함"], best: "넓은 거실창 · 발코니", mood: "세로선이 만드는 시원한 개방감", control: "세로 베인을 회전·한쪽으로 모아 큰 창을 넓게 엽니다", privacy: "방향을 틀어 빛과 시선을 조절할 수 있습니다", care: "바람이 강한 창에서는 베인 흔들림과 하단 연결부를 고려합니다", note: "넓은 통창과 발코니 문", caution: "창문을 자주 여는 공간은 바람·동선까지 확인하세요.", sourceUrl: "https://changane.com/category/%EB%B8%94%EB%9D%BC%EC%9D%B8%EB%93%9C/43/", sourceLabel: "창안애 버티컬 블라인드" },
  { id: "aluminum", family: "블라인드", name: "알루미늄 블라인드", image: "https://changane.com/web/product/medium/202211/f2707c7c18ec2fcb2a56ae8323803102.jpg", tags: ["깔끔함", "프라이버시"], best: "주방 · 욕실 인접창 · 작업 공간", mood: "선명하고 실용적인 모던함", control: "얇은 슬랫 각도를 조절해 빛을 빠르게 바꿉니다", privacy: "슬랫 기울기로 시선과 채광을 세밀하게 다룹니다", care: "물걸레 관리가 비교적 편하고 습기에 강한 소재 선택지가 있습니다", note: "관리 편의와 실용성을 우선할 때", caution: "슬랫 소음과 구김 가능성을 고려해 사용 공간을 정하세요.", sourceUrl: "https://changane.com/category/%EB%B8%94%EB%9D%BC%EC%9D%B8%EB%93%9C/43/", sourceLabel: "창안애 25mm 알루미늄블라인드" },
] as const;
