"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { submitConsultation } from "./actions";
import { captureAttribution, readAttribution } from "./attribution";
import { guideProducts } from "./guideProducts";

const projects = [
  { type: "거실", product: "쉬폰 커튼 · 우드 블라인드", tone: "project-one" },
  { type: "안방", product: "암막 이중 커튼", tone: "project-two" },
  { type: "아이방", product: "콤비 블라인드", tone: "project-three" },
  { type: "발코니", product: "우드 블라인드 · 홈카페", tone: "project-four" },
];

const realStories = [
  {
    kind: "고객이 남긴 후기",
    source: "Instagram",
    title: "암막 커튼으로 완성한 미니멀 침실",
    detail: "침실 · 100% 암막 커튼",
    quote: "컬러와 텍스처를 함께 고민해 주시고, 라인까지 꼼꼼하게 맞춰주셨어요.",
    href: "https://www.instagram.com/p/DAYG0bev2vZ/",
    tone: "review-bedroom",
  },
  {
    kind: "블린그린 실제 시공 기록",
    source: "Instagram",
    title: "고척 아이파크아파트 커튼 · 블라인드",
    detail: "아파트 · 커튼 & 블라인드",
    quote: "공개된 실제 시공 릴스에서 공간의 분위기와 설치 결과를 확인해 보세요.",
    href: "https://www.instagram.com/reel/Dak0pi5z7Lk/",
    tone: "review-living",
  },
  {
    kind: "블린그린 실제 시공 영상",
    source: "YouTube",
    title: "커튼과 블라인드, 설치 후의 변화",
    detail: "공식 채널 · 시공 영상 모음",
    quote: "영상으로 원단의 움직임과 빛이 달라지는 과정을 더 생생하게 살펴보세요.",
    href: "https://www.youtube.com/@블린그린-blingreen",
    tone: "review-video",
  },
];

export type DbReview = {
  id: number;
  customerArea: string;
  quote: string;
  reviewUrl: string;
  completedAt: string | null;
};

function formatCompletedMonth(value: string | null) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
}

const faqItems = [
  { question: "방문 상담과 실측 비용이 있나요?", answer: "김포·인천 방문 가능 지역과 상담 조건을 먼저 확인한 뒤 안내해 드립니다. 창의 구조와 제품 조합을 직접 보고, 제작 전 최종 치수는 방문 실측으로 확정합니다." },
  { question: "사진만으로도 상담을 시작할 수 있나요?", answer: "네. 창 전체, 창 주변·커튼박스, 원하는 분위기 사진을 보내주시면 제품 후보와 확인할 점을 먼저 정리해 드립니다. 다만 정확한 제작 치수와 설치 가능 여부는 현장 실측 후 확정됩니다." },
  { question: "견적은 어떤 기준으로 달라지나요?", answer: "창의 가로·세로와 형태, 원단·슬랫 소재, 이중 구성·전동 여부, 레일·브라켓 설치 조건이 함께 반영됩니다. 같은 평수라도 창 구성에 따라 견적이 달라질 수 있습니다." },
  { question: "설치까지 얼마나 걸리나요?", answer: "선택한 제품과 제작 일정에 따라 달라집니다. 상담 후 제작·설치 가능 일정을 정확히 안내해 드리며, 이사·입주 일정이 있다면 신청 때 함께 알려 주세요." },
  { question: "기존 커튼이나 블라인드 철거도 가능한가요?", answer: "기존 설치물의 종류와 벽·천장 상태를 사진으로 먼저 확인한 뒤 안내해 드립니다. 철거가 필요한 경우 상담 때 꼭 말씀해 주세요." },
  { question: "A/S는 어떻게 받나요?", answer: "설치 후 사용 중 불편한 점이 생기면 연락해 주세요. 제품·설치 상태를 확인한 뒤 가능한 조치를 안내해 드립니다. 보장 범위는 제품과 설치 조건에 따라 상담 시 확인합니다." },
];

type Need = "채광" | "암막" | "프라이버시" | "깔끔함" | "단열" | "넓은 창";

const needs: Need[] = ["채광", "암막", "프라이버시", "깔끔함", "단열", "넓은 창"];
const diagnosisQuestions = [
  { key: "room", title: "어느 공간을 바꾸고 싶으세요?", options: ["거실", "안방", "아이방", "발코니"] },
  { key: "priority", title: "가장 중요한 기준은 무엇인가요?", options: ["채광", "암막", "프라이버시", "단열", "깔끔함"] },
  { key: "mood", title: "어떤 공간 분위기를 좋아하세요?", options: ["부드럽고 호텔 같은", "내추럴하고 따뜻한", "모던하고 깔끔한", "포근하고 아늑한"] },
] as const;
const moodMatches: Record<string, string[]> = { "부드럽고 호텔 같은": ["sheer", "double"], "내추럴하고 따뜻한": ["drape", "wood"], "모던하고 깔끔한": ["combi", "roller", "aluminum"], "포근하고 아늑한": ["blackout", "honeycomb"] };

export default function Home({ dbReviews }: { dbReviews: DbReview[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<Need | "전체">("전체");
  const [selectedProduct, setSelectedProduct] = useState(guideProducts[3].id);
  const [diagnosisStep, setDiagnosisStep] = useState(0);
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [messageDraft, setMessageDraft] = useState<string | null>(null);
  const [messageDirty, setMessageDirty] = useState(false);
  const [referredMood, setReferredMood] = useState<string | null>(null);
  const filteredProducts = useMemo(() => selectedNeed === "전체" ? guideProducts : guideProducts.filter((item) => item.tags.includes(selectedNeed)), [selectedNeed]);
  const featuredProduct = guideProducts.find((item) => item.id === selectedProduct) ?? guideProducts[3];
  const diagnosisComplete = diagnosisStep === diagnosisQuestions.length;
  const diagnosisResults = useMemo(() => !diagnosisComplete ? [] : [...guideProducts].map((product) => ({ product, score: (product.best.includes(diagnosisAnswers.room) ? 4 : 0) + (product.tags.includes(diagnosisAnswers.priority as Need) ? 3 : 0) + (moodMatches[diagnosisAnswers.mood]?.includes(product.id) ? 2 : 0) })).sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.product), [diagnosisAnswers, diagnosisComplete]);
  const consultationSummary = (diagnosisComplete ? `진단 결과 · ${diagnosisAnswers.room} / ${diagnosisAnswers.priority} / ${diagnosisAnswers.mood}\n추천 제품 · ${diagnosisResults.map((product) => product.name).join(", ")}` : "제품 진단 전 · 상담을 통해 공간에 맞는 제품을 함께 추천받고 싶어요.") + (referredMood ? `\n관심 무드 · ${referredMood}` : "");
  const messageValue = messageDraft ?? consultationSummary;
  function chooseDiagnosis(option: string) { const question = diagnosisQuestions[diagnosisStep]; setDiagnosisAnswers((current) => ({ ...current, [question.key]: option })); setDiagnosisStep((current) => current + 1); }

  useEffect(() => { captureAttribution(); }, []);
  useEffect(() => {
    const mood = new URLSearchParams(window.location.search).get("mood");
    if (mood) setReferredMood(mood);
  }, []);
  useEffect(() => { if ((diagnosisComplete || referredMood) && !messageDirty) setMessageDraft(consultationSummary); }, [diagnosisComplete, referredMood, consultationSummary, messageDirty]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setSubmitError(null);
    const attribution = readAttribution();
    const formData = new FormData(form);
    formData.set("utmSource", attribution.utmSource);
    formData.set("utmMedium", attribution.utmMedium);
    formData.set("utmCampaign", attribution.utmCampaign);
    formData.set("referrer", attribution.referrer);
    formData.set("landingPath", attribution.landingPath);
    const result = await submitConsultation(formData);
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      setMessageDraft(null);
      setMessageDirty(false);
      form.reset();
    } else {
      setSubmitError(result.error);
    }
  }
  async function copyConsultation() { try { await navigator.clipboard.writeText(consultationSummary); setCopied(true); } catch { setCopied(false); } }

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="블린그린 첫 화면">블린그린</a>
        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="메뉴 열기" aria-expanded={isMenuOpen}>
          <span /> <span />
        </button>
        <nav className={isMenuOpen ? "nav open" : "nav"} aria-label="주요 메뉴">
          <a href="#projects" onClick={() => setIsMenuOpen(false)}>시공 사례</a>
          <a href="#reviews" onClick={() => setIsMenuOpen(false)}>실제 후기</a>
          <a href="/portfolio" onClick={() => setIsMenuOpen(false)}>무드 참고</a>
          <a href="#guide" onClick={() => setIsMenuOpen(false)}>제품 가이드</a>
          <a href="#diagnosis" onClick={() => setIsMenuOpen(false)}>제품 진단</a>
          <a href="#process" onClick={() => setIsMenuOpen(false)}>상담 안내</a>
          <a href="#reservation" className="nav-cta" onClick={() => setIsMenuOpen(false)}>상담 예약</a>
        </nav>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-image" role="img" aria-label="햇살이 들어오는 모던한 거실의 쉬폰 커튼과 블라인드" />
        <div className="hero-scrim" />
        <div className="hero-copy">
          <p className="eyebrow">KIMPO · INCHEON CURTAIN &amp; BLIND</p>
          <h1 id="hero-title">일상에 빛을,<br />공간에 특별함을</h1>
          <p className="hero-subtitle">무료 방문 상담 · 실측 · 맞춤 제작 · 설치 · 2년 A/S</p>
          <div className="hero-actions">
            <a className="button button-dark" href="#reservation">무료 방문상담 예약</a>
            <a className="button button-light" href="tel:01049518294">전화 상담</a>
          </div>
          <p className="hero-note"><span>✓</span> 전문가가 직접 방문하여 공간에 맞는 솔루션을 제안합니다.</p>
        </div>
        <div className="hero-index" aria-hidden="true"><span>01</span><i /> <span>04</span></div>
      </section>

      <section className="diagnosis section" id="diagnosis" aria-labelledby="diagnosis-title">
        <div className="diagnosis-heading"><div><p className="section-kicker">3-MINUTE STYLE FINDER</p><h2 id="diagnosis-title">내 공간에 맞는<br />제품을 먼저 찾아보세요.</h2></div><p>세 가지 질문에 답하면, 생활 방식과 공간에 어울리는 제품 후보를 3개까지 골라드려요.</p></div>
        <div className="diagnosis-box">{!diagnosisComplete ? <><p className="diagnosis-number">0{diagnosisStep + 1} / 03</p><h3>{diagnosisQuestions[diagnosisStep].title}</h3><div className="diagnosis-options">{diagnosisQuestions[diagnosisStep].options.map((option) => <button key={option} onClick={() => chooseDiagnosis(option)}>{option}<span>↗</span></button>)}</div></> : <><p className="diagnosis-number">YOUR CURATED PICKS</p><h3><b>{diagnosisAnswers.room}</b>에 어울리는<br />추천 제품이에요.</h3><p className="result-summary"><b>{diagnosisAnswers.priority}</b>을 우선하고 <b>{diagnosisAnswers.mood}</b> 분위기를 선호하셨네요.</p><div className="result-products">{diagnosisResults.map((product, index) => <button key={product.id} onClick={() => { setSelectedProduct(product.id); document.getElementById("guide")?.scrollIntoView({ behavior: "smooth" }); }}><span>0{index + 1}</span><img src={product.image} alt="" /><div><p>{product.family}</p><strong>{product.name}</strong><small>{product.best}</small></div></button>)}</div><a className="diagnosis-cta" href="#reservation">이 추천을 상담에 담기 <span>↗</span></a><button className="restart-button" onClick={() => { setDiagnosisAnswers({}); setDiagnosisStep(0); }}>다시 진단하기 ↻</button></>}</div>
      </section>

      <section className="intro section" aria-labelledby="intro-title">
        <div><p className="section-kicker">OUR APPROACH</p><h2 id="intro-title">창을 가리는 것이 아니라,<br />공간의 분위기를 완성합니다.</h2></div>
        <p className="intro-copy">김포와 인천의 고객님 댁으로 직접 찾아가 창의 크기, 빛의 방향, 생활 방식을 살핍니다. 오래 보아도 편안한 선택을 함께 찾고, 깔끔한 설치와 사후 관리까지 책임집니다.</p>
      </section>

      <section className="areas section" aria-label="시공 가능 지역">
        <p className="section-kicker">SERVICE AREA</p>
        <div className="areas-row"><h2>가까운 공간으로<br />찾아갑니다.</h2><div className="area-tags"><span>김포</span><span>검단</span><span>청라</span><span>송도</span><span>인천 전 지역</span></div></div>
        <p className="small-note">정확한 방문 가능 지역은 상담 시 확인해 드립니다.</p>
      </section>

      <section className="projects section" id="projects" aria-labelledby="projects-title">
        <div className="section-heading"><div><p className="section-kicker">SELECTED WORKS</p><h2 id="projects-title">공간마다 다른,<br />빛의 표정</h2></div><a className="text-link" href="#reservation">우리 집도 상담하기 <span>↗</span></a></div>
        <div className="project-grid">
          {projects.map((project, index) => <article className={`project-card ${project.tone}`} key={project.type}><div className="project-art" /><div className="project-info"><p>{String(index + 1).padStart(2, "0")}</p><h3>{project.type}</h3><span>{project.product}</span></div></article>)}
        </div>
      </section>

      <section className="social section" aria-labelledby="social-title">
        <div className="section-heading social-heading">
          <div><p className="section-kicker">FOLLOW BLINGREEN</p><h2 id="social-title">사진으로 보고,<br />영상으로 더 생생하게</h2></div>
          <p>블린그린의 실제 시공 분위기와 공간별 아이디어를<br />인스타그램·유튜브·블로그에서 만나보세요.</p>
        </div>
        <div className="social-grid social-grid-three">
          <a className="social-card social-instagram" href="https://www.instagram.com/blin_green/" target="_blank" rel="noreferrer" aria-label="블린그린 인스타그램 열기">
            <div className="social-photo"><span className="social-icon instagram-icon" aria-hidden="true" /></div>
            <div className="social-content"><div><p>INSTAGRAM</p><h3>@blin_green</h3></div><span className="social-arrow">↗</span></div>
            <p className="social-description">공간별 시공 사진과 최신 작업 소식을 보세요.</p>
          </a>
          <a className="social-card social-youtube" href="https://www.youtube.com/@블린그린-blingreen" target="_blank" rel="noreferrer" aria-label="블린그린 유튜브 채널 열기">
            <div className="social-photo"><span className="social-icon youtube-icon" aria-hidden="true" /><span className="play-button" aria-hidden="true">▶</span></div>
            <div className="social-content"><div><p>YOUTUBE</p><h3>블린그린</h3></div><span className="social-arrow">↗</span></div>
            <p className="social-description">커튼과 블라인드가 완성되는 모습을 영상으로 보세요.</p>
          </a>
          <a className="social-card social-naver" href="https://m.blog.naver.com/PostList.naver?blogId=blingreen&tab=1" target="_blank" rel="noreferrer" aria-label="블린그린 네이버 블로그 열기">
            <div className="social-photo"><span className="social-icon naver-icon" aria-hidden="true">N</span></div>
            <div className="social-content"><div><p>BLOG</p><h3>블린그린</h3></div><span className="social-arrow">↗</span></div>
            <p className="social-description">시공 후기와 공간별 이야기를 블로그에서 자세히 보세요.</p>
          </a>
        </div>
      </section>

      <section className="reviews section" id="reviews" aria-labelledby="reviews-title">
        <div className="section-heading reviews-heading">
          <div><p className="section-kicker">REAL STORIES</p><h2 id="reviews-title">말보다 먼저,<br />완성된 공간으로 답합니다.</h2></div>
          <p>블린그린의 공개 인스타그램·유튜브 콘텐츠에서 확인할 수 있는 실제 시공 기록과 공개 후기를 구분해 모았습니다.</p>
        </div>
        <div className="review-feature"><span>REAL REVIEW</span><p>상담부터 설치 후의 일상까지, 직접 확인할 수 있는 이야기만 담습니다.</p><a href="https://www.instagram.com/blin_green/" target="_blank" rel="noreferrer">블린그린 인스타그램 전체 보기 <b>↗</b></a></div>
        <div className="review-grid">
          {dbReviews.map((review, index) => {
            const Tag = review.reviewUrl ? "a" : "div";
            return (
              <Tag
                className="review-card review-db"
                key={`db-${review.id}`}
                {...(review.reviewUrl ? { href: review.reviewUrl, target: "_blank", rel: "noreferrer" } : {})}
                aria-label={review.reviewUrl ? "후기 원문 열기" : undefined}
              >
                <div className="review-image"><span>{String(index + 1).padStart(2, "0")}</span><i>◎</i></div>
                <div className="review-copy">
                  <p className="review-source">시공 완료 고객 후기{review.customerArea ? ` · ${review.customerArea}` : ""}</p>
                  <h3>{formatCompletedMonth(review.completedAt) || "시공 완료 고객"} 후기</h3>
                  <blockquote>“{review.quote}”</blockquote>
                  {review.reviewUrl && <strong>원문 보기 <b>↗</b></strong>}
                </div>
              </Tag>
            );
          })}
          {realStories.map((story, index) => <a className={`review-card ${story.tone}`} key={story.title} href={story.href} target="_blank" rel="noreferrer" aria-label={`${story.title} 원문 열기`}>
            <div className="review-image"><span>{String(dbReviews.length + index + 1).padStart(2, "0")}</span><i>{story.source === "YouTube" ? "▶" : "◎"}</i></div>
            <div className="review-copy"><p className="review-source">출처 · {story.source}</p><h3>{story.title}</h3><small>{story.detail}</small><blockquote>“{story.quote}”</blockquote><strong>원문 보기 <b>↗</b></strong></div>
          </a>)}
        </div>
        <p className="review-note">※ 실제 시공을 완료한 고객님께 직접 요청해 받은 후기와, 블린그린 공식 채널의 공개 시공 기록을 함께 모았습니다. 원문 링크가 있는 카드는 누르면 출처로 이동합니다.</p>
      </section>

      <section className="mood-teaser section" aria-labelledby="mood-teaser-title">
        <div className="mood-teaser-inner">
          <div>
            <p className="section-kicker">STYLING REFERENCE</p>
            <h2 id="mood-teaser-title">호텔 · 카페처럼<br />원하는 분위기가 있으신가요?</h2>
            <p>대면 상담용으로 준비한 무드 참고 포트폴리오에서, 원하는 분위기와 어울리는 제품 조합을 먼저 살펴보세요.</p>
          </div>
          <a className="button button-dark" href="/portfolio" target="_blank" rel="noreferrer">무드 참고 포트폴리오 보기 <span>↗</span></a>
        </div>
      </section>

      <section className="guide section" id="guide" aria-labelledby="guide-title">
        <p className="section-kicker">CURATED PRODUCT GUIDE</p>
        <div className="guide-head"><h2 id="guide-title">우리 집에는<br />무엇이 맞을까요?</h2><p>한국에서 가장 많이 만나는 커튼·블라인드 10종을, 제품 이름보다 생활 방식으로 먼저 골라보세요.</p></div>
        <div className="guide-intro"><p><b>01</b> 먼저 필요한 기능을 고르고</p><p><b>02</b> 각 제품의 창 연출을 보고</p><p><b>03</b> 마음에 드는 후보를 상담 때 보여주세요.</p></div>

        <div className="need-filter" aria-label="필요한 기능으로 제품 걸러보기">
          <button className={selectedNeed === "전체" ? "active" : ""} onClick={() => setSelectedNeed("전체")}>전체 보기 <em>{guideProducts.length}</em></button>
          {needs.map((need) => <button className={selectedNeed === need ? "active" : ""} key={need} onClick={() => setSelectedNeed(need)}>{need}<em>{guideProducts.filter((item) => item.tags.includes(need)).length}</em></button>)}
        </div>

        <div className="guide-legend"><span><i className="curtain-dot" /> 커튼 — 원단의 질감과 드레이프</span><span><i className="blind-dot" /> 블라인드 — 구조적이고 정돈된 빛 조절</span><span>카드를 누르면 상세 비교가 열립니다.</span></div>
        <div className="product-cards">
          {filteredProducts.map((product) => <button className={`product-card ${selectedProduct === product.id ? "selected" : ""}`} key={product.id} onClick={() => setSelectedProduct(product.id)} aria-pressed={selectedProduct === product.id}>
            <span className="product-number">{String(guideProducts.indexOf(product) + 1).padStart(2, "0")}</span><div className="product-visual product-photo"><img src={product.image} alt={`${product.sourceLabel} 공식 제품 이미지`} /></div>
            <div className="product-card-copy"><p>{product.family}</p><h3>{product.name}</h3><span>{product.best}</span></div><span className="card-more">자세히 보기 <b>↗</b></span>
          </button>)}
        </div>

        <aside className="product-detail" aria-live="polite">
          <div className="detail-title"><p>{featuredProduct.family.toUpperCase()} / {featuredProduct.best}</p><h3>{featuredProduct.name}</h3><strong>{featuredProduct.mood}</strong><div className="detail-tags">{featuredProduct.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          <div className="detail-visual product-visual product-photo"><img src={featuredProduct.image} alt={`${featuredProduct.sourceLabel} 공식 제품 이미지`} /></div>
          <dl><div><dt>빛 조절</dt><dd>{featuredProduct.control}</dd></div><div><dt>프라이버시</dt><dd>{featuredProduct.privacy}</dd></div><div><dt>관리 포인트</dt><dd>{featuredProduct.care}</dd></div></dl>
          <div className="detail-recommend"><p>이런 집에 추천</p><strong>{featuredProduct.note}</strong><span>상담 체크 · {featuredProduct.caution}</span><a className="official-source" href={featuredProduct.sourceUrl} target="_blank" rel="noreferrer">공식 제품 보기 · {featuredProduct.sourceLabel} <b>↗</b></a></div>
        </aside>
        <div className="guide-disclaimer">※ 제품 이미지는 창안애 공식 온라인몰의 대표 제품컷을 큐레이션 참고용으로 연결했습니다. 같은 제품명이라도 원단, 슬랫 폭, 설치 방식, 창의 방향과 틈에 따라 채광·암막·단열 체감은 달라집니다. 실측 상담에서 최종 확인해 드립니다.</div>
        <div className="guide-cta"><div><p className="section-kicker">MY SHORTLIST</p><h3>관심 제품을 고르셨나요?</h3><p>마음에 든 제품과 창 사진을 보내주시면, 공간에 맞는 조합으로 함께 좁혀드릴게요.</p></div><a href="#reservation">이 제품으로 상담하기 <span>↗</span></a></div>
      </section>

      <section className="quote-guide section" aria-labelledby="quote-title">
        <div><p className="section-kicker">ESTIMATE GUIDE</p><h2 id="quote-title">견적은 어떻게<br />정해지나요?</h2><p>커튼과 블라인드는 창마다 맞춤 제작하는 제품이라, 같은 평수라도 창의 크기와 선택 구성에 따라 달라집니다. 방문 실측 뒤 정확한 견적을 안내해 드려요.</p></div>
        <div className="quote-factors"><article><span>01</span><h3>창의 크기 · 형태</h3><p>가로·세로 치수, 통창 여부, 창문 열림 방향과 커튼 박스 유무를 확인합니다.</p></article><article><span>02</span><h3>제품 · 원단 · 소재</h3><p>쉬폰, 암막, 우드, 허니콤 등 제품 종류와 원단·슬랫의 등급을 함께 고릅니다.</p></article><article><span>03</span><h3>구성 · 설치 방식</h3><p>속·겉 이중 구성, 전동 여부, 레일·브라켓과 설치 난이도가 반영됩니다.</p></article><article><span>04</span><h3>공간별 맞춤 제안</h3><p>채광·프라이버시·단열 우선순위와 생활 동선에 맞춰 필요한 구성을 정합니다.</p></article></div>
        <div className="quote-bottom"><p><b>상담 전 준비하면 좋은 것</b> · 창 전체가 보이는 사진 1장, 대략적인 가로·세로, 원하는 분위기</p><a href="#reservation">내 공간 견적 상담하기 <span>↗</span></a></div>
      </section>

      <section className="process section" id="process" aria-labelledby="process-title">
        <div className="section-heading"><div><p className="section-kicker">HOW IT WORKS</p><h2 id="process-title">편안한 상담부터<br />완성되는 설치까지</h2></div></div>
        <ol className="steps"><li><span>01</span><h3>상담 신청</h3><p>원하는 분위기와 공간을 편하게 알려주세요.</p></li><li><span>02</span><h3>방문 실측 · 제안</h3><p>창과 채광을 직접 보고 선택지를 제안합니다.</p></li><li><span>03</span><h3>맞춤 제작</h3><p>선택한 원단과 사이즈에 맞춰 정성껏 제작합니다.</p></li><li><span>04</span><h3>설치 · A/S</h3><p>깔끔하게 설치하고, 2년 동안 함께 관리합니다.</p></li></ol>
      </section>

      <section className="photo-guide section" aria-labelledby="photo-guide-title">
        <div className="section-heading photo-heading"><div><p className="section-kicker">PHOTO-READY CONSULTATION</p><h2 id="photo-guide-title">창 사진 3장으로,<br />상담이 더 정확해져요.</h2></div><p>방문 전 사진을 보내주시면 AI 기반 사전 체크로 창 구조·빛·설치 여건에서 확인할 항목을 정리해, 상담을 더 빠르고 구체적으로 도와드릴 수 있어요.</p></div>
        <div className="photo-steps">
          <article><span>01</span><h3>창 전체</h3><p>방 한쪽 벽과 창 전체가 함께 보이도록, 낮에 한 장 촬영해 주세요.</p></article>
          <article><span>02</span><h3>창 주변 · 커튼박스</h3><p>천장, 커튼박스, 창틀, 창문이 열리는 방향이 보이게 촬영해 주세요.</p></article>
          <article><span>03</span><h3>원하는 분위기</h3><p>마음에 든 제품 가이드나 인테리어 이미지를 함께 보내주시면 좋아요.</p></article>
        </div>
        <div className="photo-helper">
          <div><p className="section-kicker">AI PRE-CHECK</p><h3>AI는 상담 준비를 돕고,<br />최종 실측은 사람이 합니다.</h3><p>사진으로는 제품 후보, 창 주변 간섭 가능성, 추가 확인할 부분을 먼저 정리합니다. 제작 치수·설치 가능 여부·최종 견적은 반드시 방문 실측 후 확정합니다.</p></div>
          <label className="photo-picker"><span>사진을 미리 골라보기</span><input type="file" accept="image/*" multiple onChange={(event) => setPhotoNames(Array.from(event.target.files ?? []).slice(0, 3).map((file) => file.name))} /><b>내 기기에서 선택 ↗</b></label>
          <div className="photo-status" aria-live="polite"><strong>{photoNames.length ? `${photoNames.length}장 선택됨` : "아직 선택한 사진이 없어요"}</strong><p>{photoNames.length ? photoNames.join(" · ") : "선택한 사진은 이 기기에서만 확인되며, 현재 사이트에서는 자동 전송되지 않습니다."}</p></div>
        </div>
      </section>

      <section className="faq section" aria-labelledby="faq-title">
        <div className="section-heading faq-heading"><div><p className="section-kicker">FREQUENTLY ASKED QUESTIONS</p><h2 id="faq-title">상담 전,
          <br />자주 궁금한 것들</h2></div><p>모호한 부분은 미리 알려드리고, 실제 현장에서는 창과 생활 방식을 함께 보고 최종 제안을 드립니다.</p></div>
        <div className="faq-list">{faqItems.map((item, index) => <article className={openFaq === index ? "faq-item open" : "faq-item"} key={item.question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.question}</strong><b>{openFaq === index ? "−" : "+"}</b></button>{openFaq === index && <p>{item.answer}</p>}</article>)}</div>
      </section>

      <section className="reservation" id="reservation" aria-labelledby="reservation-title">
        <div className="reservation-copy"><p className="section-kicker">VISIT CONSULTATION</p><h2 id="reservation-title">우리 집 창,<br />어떻게 바꾸면 좋을지<br />함께 이야기해요.</h2><p>사진 한 장으로도 먼저 상담할 수 있어요.<br />아래 진단 결과는 상담 내용에 자동으로 담깁니다.</p><div className="consultation-summary"><span>MY STYLE SUMMARY</span><strong>{diagnosisComplete ? `${diagnosisAnswers.room} · ${diagnosisAnswers.priority}` : "아직 제품 진단 전"}</strong><p>{diagnosisComplete ? diagnosisResults.map((product) => product.name).join(" · ") : "공간과 생활 방식에 맞춰 함께 추천해 드려요."}</p><button type="button" onClick={copyConsultation}>{copied ? "상담 내용이 복사되었어요 ✓" : "진단 결과 복사하기"} <b>↗</b></button></div><a className="phone" href="tel:01049518294">010 4951 8294 <span>↗</span></a></div>
        <form className="reservation-form" onSubmit={handleSubmit}>
          <label>성함<input required name="name" placeholder="성함을 입력해 주세요" /></label>
          <label>연락처<input required name="phone" inputMode="tel" placeholder="010-0000-0000" /></label>
          <div className="form-row"><label>지역<input name="area" placeholder="예: 청라, 김포 풍무동" /></label><label>상담 방식<select name="method" defaultValue=""><option value="" disabled>선택해 주세요</option><option>전화 상담</option><option>방문 실측 상담</option><option>제품 추천 상담</option></select></label></div>
          <label>관심 제품 · 진단 결과<textarea name="message" rows={4} value={messageValue} onChange={(event) => { setMessageDraft(event.target.value); setMessageDirty(true); }} aria-label="관심 제품 및 진단 결과" /></label>
          <label>추가로 알려주실 내용<textarea name="detail" rows={3} placeholder="창 사진 보유 여부, 희망 시기, 기존 설치물·철거 여부 등을 적어 주세요" /></label>
          <label className="consent"><input type="checkbox" required /><span>상담을 위한 개인정보 수집 및 이용에 동의합니다.</span></label>
          <button className="submit-button" type="submit" disabled={submitting}>{submitting ? "접수 중..." : "방문상담 신청하기"} <span>↗</span></button>
          {submitted && <p className="form-message" role="status">신청이 정상 접수됐어요. 빠르게 연락드릴게요. 급하시면 <a href="tel:01049518294">전화 상담</a>도 가능합니다.</p>}
          {submitError && <p className="form-message form-error" role="alert">{submitError} <button type="button" className="inline-copy" onClick={copyConsultation}>진단 결과를 복사</button>해 전화 상담 시 전달해 주세요.</p>}
        </form>
      </section>

      <footer><a className="wordmark" href="#top">블린그린</a><p>김포 · 인천 커튼 &amp; 블라인드 맞춤 시공</p><div className="footer-social"><a href="https://www.instagram.com/blin_green/" target="_blank" rel="noreferrer">INSTAGRAM ↗</a><a href="https://www.youtube.com/@블린그린-blingreen" target="_blank" rel="noreferrer">YOUTUBE ↗</a><a href="https://m.blog.naver.com/PostList.naver?blogId=blingreen&tab=1" target="_blank" rel="noreferrer">BLOG ↗</a></div><small>이미지 출처 : 창안애</small><small>사업자 정보 및 카카오톡 채널은 공식 확인 후 반영 예정입니다.</small></footer>
      <div className="mobile-actions"><a href="tel:01049518294">전화 상담</a><a href="#reservation">무료 방문상담</a></div>
    </main>
  );
}
