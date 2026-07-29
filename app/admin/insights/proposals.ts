export type ProposalStatus = "idea" | "ready" | "in-progress" | "done";

export type Proposal = {
  id: string;
  title: string;
  status: ProposalStatus;
  effort: "낮음" | "중간" | "높음";
  impact: "낮음" | "중간" | "높음";
  summary: string;
  benefits: string[];
  howItWorks: string;
  steps: string[];
  caveats?: string[];
};

export const proposals: Proposal[] = [
  {
    id: "youtube-feed",
    title: "YouTube 자동 연동 — 최신 시공 영상 자동 노출",
    status: "ready",
    effort: "낮음",
    impact: "중간",
    summary:
      "블린그린 유튜브 채널에 새 영상을 올리면, 홈페이지 'FOLLOW BLINGREEN' 섹션이 자동으로 최신 영상을 가져와 보여줍니다. 지금은 채널 링크만 걸려 있어 방문자가 직접 유튜브로 나가야 최신 영상을 볼 수 있습니다.",
    benefits: [
      "새 영상을 올릴 때마다 홈페이지를 수동으로 업데이트할 필요가 없음",
      "사이트 체류시간 증가 — 방문자가 나가지 않고 바로 시공 영상을 볼 수 있음",
      "API 키 하나로 끝, 만료·재인증 같은 운영 부담이 사실상 없음(Instagram과 대비됨)",
    ],
    howItWorks:
      "YouTube Data API v3의 channels.list로 채널의 '업로드 재생목록 ID'를 한 번 조회해 코드에 고정하고, 이후에는 playlistItems.list로 최신 영상 목록(제목, 썸네일, 링크)만 가져옵니다. 무료 할당량 10,000 unit/day 중 하루 몇 unit만 쓰므로 사실상 무제한입니다.",
    steps: [
      "Google Cloud Console에서 프로젝트 생성 후 'YouTube Data API v3' 활성화, API 키 발급",
      "발급받은 키를 Cloudflare Worker secret으로 등록 (wrangler secret put YOUTUBE_API_KEY)",
      "채널 uploads 재생목록 ID를 한 번 조회해 코드에 저장",
      "홈페이지 소셜 섹션에서 빌드 시점 또는 요청 시점에 최신 영상 3~4개를 가져와 카드로 표시",
    ],
    caveats: [
      "영상 캡션/설명까지 자동으로 보여주려면 API 응답에서 description 필드를 추가로 파싱해야 함",
    ],
  },
  {
    id: "instagram-feed",
    title: "Instagram 자동 연동 — 최신 게시물 자동 노출",
    status: "idea",
    effort: "높음",
    impact: "중간",
    summary:
      "인스타그램(@blin_green) 최신 게시물을 홈페이지에 자동으로 가져오는 기능. YouTube와 달리 Meta의 인증 토큰이 60일마다 만료되어, 자동 갱신이 실패하면 사람이 직접 재로그인해야 하는 운영 부담이 있습니다.",
    benefits: [
      "인스타그램에 올린 시공 사진이 홈페이지에도 자동 반영",
      "SNS와 홈페이지 콘텐츠 이중 관리 부담 감소",
    ],
    howItWorks:
      "'Instagram API with Instagram Login'(옛 Basic Display API의 후속)을 사용합니다. Business/Creator 계정 전환 후 Meta 개발자 앱을 만들고, 최초 1회 OAuth 로그인으로 장기 토큰(60일)을 발급받습니다. 이 토큰을 D1에 저장해두고, Cloudflare Cron Trigger로 50일마다 자동 갱신 요청을 보냅니다.",
    steps: [
      "인스타그램 계정을 비즈니스/크리에이터 계정으로 전환",
      "Meta for Developers에서 앱 생성, Instagram API 제품 추가",
      "1회성 OAuth 로그인으로 장기 액세스 토큰 발급받아 D1에 저장",
      "Cloudflare Cron Trigger(주 1회)로 토큰 자동 갱신 작업 구현",
      "토큰 갱신 실패 시 관리자에게 알림(이메일 등)이 가도록 구성 — 이게 없으면 60일 뒤 소리소문 없이 멈춤",
      "게시물 목록 API로 이미지/캡션/링크를 가져와 홈페이지에 노출",
    ],
    caveats: [
      "핵심 리스크: 토큰은 영구적이지 않음. 자동 갱신이 실패하면(비밀번호 변경, 정책 변경 등) 사람이 브라우저로 재로그인해야 함",
      "1인 운영 체제에서는 이 실패를 아무도 눈치채지 못하고 몇 달 방치될 가능성이 있음",
      "대안: 자동 연동 대신 관리자가 사진을 직접 업로드하는 '시공사례' 기능(별도 제안 참고)이 운영 부담 없이 비슷한 효과를 낼 수 있음",
    ],
  },
  {
    id: "ai-content-generator",
    title: "AI 콘텐츠 생성 — 사진+지역만 넣으면 SNS 글 자동 작성",
    status: "idea",
    effort: "중간",
    impact: "높음",
    summary:
      "관리자가 시공 사진과 지역, 사용 제품만 입력하면 AI(Gemini)가 네이버 블로그용 글, 인스타그램 캡션, 유튜브 설명을 각각 자동으로 작성해줍니다. 자동으로 게시하지는 않고, 관리자가 결과를 복사해 각 채널에 직접 붙여넣는 방식입니다.",
    benefits: [
      "SNS/블로그 글쓰기에 드는 시간을 크게 절약 — 사진만 있으면 3종 콘텐츠 초안이 바로 나옴",
      "말투와 형식이 채널별로 최적화됨(블로그는 길고 상세하게, 인스타는 짧고 해시태그 위주)",
      "API 인증이 필요 없어(순수 텍스트 생성) 운영 부담이 거의 없음",
    ],
    howItWorks:
      "관리자 화면에 시공사례 등록 폼(사진 업로드 + 지역/공간/제품 입력)을 만들고, '콘텐츠 생성' 버튼을 누르면 Gemini API로 프롬프트를 보내 3종 텍스트를 받아옵니다. 사진은 Cloudflare R2에 저장합니다.",
    steps: [
      "Google AI Studio(aistudio.google.com)에서 무료 Gemini API 키 발급",
      "Cloudflare R2 버킷 활성화(대시보드에서 1회 설정) 및 wrangler.jsonc에 바인딩 추가",
      "시공사례 테이블(사진 URL, 지역, 공간, 제품, 생성된 글) 설계 및 D1 마이그레이션",
      "관리자 화면에 사진 업로드 + 정보 입력 폼 추가",
      "Gemini API 호출 서버 액션 구현 — 블로그/인스타/유튜브용 프롬프트 각각 설계",
      "생성된 글을 화면에 표시하고 클립보드 복사 버튼 제공",
    ],
    caveats: [
      "이미 진행 중이던 항목 — R2 활성화 단계에서 중단된 상태",
      "무료 티어 한도를 넘으면 과금이 발생할 수 있음(사용량이 매우 적어 실질적으로는 무료 범위 내일 가능성이 높음)",
    ],
  },
  {
    id: "ai-consultation-bot",
    title: "AI 자동 상담 — 챗봇으로 1차 문의 응대",
    status: "idea",
    effort: "높음",
    impact: "높음",
    summary:
      "홈페이지에 채팅창을 두고, 방문자가 '거실 창에 어울리는 커튼 추천해줘', '견적이 대략 얼마나 나올까요?' 같은 질문을 하면 AI가 즉시 답변합니다. 이미 만들어둔 제품 가이드·진단 로직·단가 데이터를 AI가 참고해서 답하도록 구성할 수 있습니다.",
    benefits: [
      "야간·주말 등 상담 불가능한 시간에도 1차 응대가 가능해 문의 이탈을 줄임",
      "반복적인 질문(가격대, 설치 기간, A/S 등)에 대한 응대 부담을 줄여줌",
      "대화 내용을 자동으로 문의(inquiry)로 등록해 관리자가 바로 이어받을 수 있음",
    ],
    howItWorks:
      "Gemini API에 '시스템 프롬프트'로 블린그린의 제품 정보, 가격 정책, 상담 원칙을 미리 알려주고, 방문자의 질문에 답하게 합니다. 정확한 견적·실측처럼 AI가 답할 수 없는 질문은 '방문 상담이 필요합니다'로 안내하고 상담 폼으로 자연스럽게 연결합니다.",
    steps: [
      "채팅 UI 컴포넌트 제작(홈페이지 우측 하단 플로팅 버튼 등)",
      "제품 가이드·단가·FAQ 데이터를 AI 프롬프트에 포함시키는 '지식 베이스' 구성",
      "Gemini API 호출 API 라우트 구현(스트리밍 응답 고려)",
      "AI가 답하기 어려운 질문(정확한 견적, 실측 일정 등)은 상담 폼으로 유도하는 규칙 설계",
      "대화 이력을 D1에 저장해 관리자가 어떤 대화가 오갔는지 확인 가능하게 함",
      "악용 방지(과도한 요청 제한, 부적절한 질문 필터링) 추가",
    ],
    caveats: [
      "가장 난이도가 높은 항목 — 위 두 AI 항목(콘텐츠 생성, 자동 상담)의 인프라를 먼저 갖춘 뒤 진행하는 것을 권장",
      "잘못된 정보(예: 부정확한 견적)를 AI가 확답처럼 말하지 않도록 프롬프트 설계에 신경써야 함",
    ],
  },
  {
    id: "customer-portal",
    title: "고객용 진행상황 조회 페이지",
    status: "idea",
    effort: "중간",
    impact: "중간",
    summary:
      "고객이 본인 전화번호로 접속해 '내 문의가 지금 어떤 상태인지, 시공일이 언제인지'를 직접 확인할 수 있는 페이지. 지금은 고객이 진행상황을 알려면 전화로 문의해야 합니다.",
    benefits: [
      "\"언제 오세요?\" 같은 반복 문의 전화를 줄여줌",
      "고객이 스스로 확인할 수 있어 신뢰도 상승",
    ],
    howItWorks:
      "전화번호 + 간단한 인증(문자 인증 또는 접수 시 알려준 코드)으로 로그인 없이 본인 문의 상태만 조회하는 짧은 페이지를 만듭니다.",
    steps: [
      "문의 등록 시 고유 조회 코드 자동 생성",
      "상담 신청 완료 문자/안내에 조회 링크 포함",
      "전화번호+코드로 본인 문의의 상태·시공일만 보여주는 읽기 전용 페이지 제작",
    ],
    caveats: [
      "문자 발송 기능(SMS API 연동)이 선행되어야 실효성이 큼 — 지금은 상담 완료 알림도 없는 상태",
    ],
  },
];
