import type { Metadata } from "next";
import { moodGuides } from "../moodGuides";
import { guideProducts } from "../guideProducts";

export const metadata: Metadata = {
  title: "무드 참고 포트폴리오 · 블린그린",
  description: "대면 상담용 무드 참고 스타일링 가이드 — 원하는 공간 분위기와 어울리는 커튼 · 블라인드 조합을 살펴보세요.",
};

export default function PortfolioPage() {
  const moodGuidesResolved = moodGuides.map((mood) => ({
    ...mood,
    products: mood.productIds
      .map((id) => guideProducts.find((p) => p.id === id))
      .filter((p): p is (typeof guideProducts)[number] => Boolean(p)),
  }));

  return (
    <main className="portfolio-page">
      <header className="portfolio-header">
        <a className="wordmark" href="/">블린그린</a>
        <a className="phone" href="tel:01049518294">010 4951 8294</a>
      </header>

      <section className="portfolio-hero">
        <p className="section-kicker">STYLING REFERENCE PORTFOLIO</p>
        <h1>원하시는 공간의 분위기,<br />먼저 눈으로 확인해 보세요.</h1>
        <p className="lead">태블릿으로 함께 보며 상담하기 위해 준비한 무드 참고 자료입니다. 익숙한 공간의 분위기를 참고해, 그 느낌에 어울리는 제품 조합을 미리 제안해 드립니다.</p>
        <p className="portfolio-disclaimer">※ 아래 이미지와 설명은 특정 장소를 블린그린이 실제로 시공했다는 의미가 아니며, 무드를 설명하기 위한 스타일 참고 자료(무료 라이선스 이미지)입니다. 실제 조합과 시공 가능 여부는 방문 상담에서 확인해 드립니다.</p>
      </section>

      <div className="portfolio-grid">
        {moodGuidesResolved.map((mood) => (
          <article className="portfolio-card" key={mood.id}>
            <div className="portfolio-card-art" style={{ backgroundImage: `url(${mood.image})` }}>
              <span className="portfolio-card-badge">무드 참고</span>
              <span className="portfolio-card-credit">사진 · {mood.imageCredit}</span>
            </div>
            <div className="portfolio-card-body">
              <p className="portfolio-card-kicker">{mood.kicker}</p>
              <h2>{mood.label}</h2>
              <p className="portfolio-card-desc">{mood.description}</p>
              <div className="portfolio-card-products">
                {mood.products.map((product) => (
                  <div className="portfolio-product-chip" key={product.id}>
                    <img src={product.image} alt="" />
                    <span>{product.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="portfolio-footer-cta">마음에 드는 무드가 있으신가요? 상담 중 말씀해 주시면, 우리 집 창에 맞는 조합으로 함께 좁혀드릴게요.</p>
    </main>
  );
}
