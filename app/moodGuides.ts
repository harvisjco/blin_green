// Mood-reference styling guide, shared by the homepage summary and the
// in-person consultation portfolio (/portfolio).
//
// These are NOT claims that blingreen installed at any named venue — copy
// must stay in "이런 무드를 원하신다면" framing, never "우리가 시공한 곳" framing.
// Images are free-license stock photos chosen to evoke the mood, not photos
// of any specific real venue.
export const moodGuides = [
  {
    id: "hotel-lobby",
    label: "호텔식 로비 무드",
    kicker: "GRAND LOBBY MOOD",
    description: "고급 호텔 로비에서 느껴지는 풍성하고 격식 있는 분위기를 참고했습니다. 두 겹의 커튼이 낮과 밤 모두 우아한 인상을 만듭니다.",
    productIds: ["double", "sheer"],
    tone: "mood-lobby",
    image: "https://images.unsplash.com/photo-1759038086832-795644825e3a?auto=format&fit=crop&w=1200&q=80",
    imageCredit: "Unsplash",
  },
  {
    id: "hotel-bedroom",
    label: "호텔식 침실 무드",
    kicker: "SUITE BEDROOM MOOD",
    description: "여행지 호텔 객실처럼 완전한 암막과 차분함을 원할 때 참고하는 조합입니다. 숙면과 아늑함에 집중했습니다.",
    productIds: ["blackout", "honeycomb"],
    tone: "mood-bedroom",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    imageCredit: "Unsplash",
  },
  {
    id: "french-cafe",
    label: "프렌치 카페 무드",
    kicker: "FRENCH CAFÉ MOOD",
    description: "파리의 작은 카페에서 느껴지는 내추럴하고 따뜻한 질감을 참고했습니다. 린넨과 우드의 조합이 편안한 인상을 만듭니다.",
    productIds: ["drape", "wood"],
    tone: "mood-cafe",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    imageCredit: "Unsplash",
  },
  {
    id: "minimal-resort",
    label: "미니멀 리조트 리빙룸 무드",
    kicker: "MINIMAL RESORT MOOD",
    description: "군더더기 없는 리조트 라운지처럼 깔끔하고 개방적인 인상을 원할 때 참고하는 조합입니다. 넓은 창을 시원하게 정리합니다.",
    productIds: ["roller", "vertical"],
    tone: "mood-resort",
    image: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?auto=format&fit=crop&w=1200&q=80",
    imageCredit: "Unsplash",
  },
] as const;
