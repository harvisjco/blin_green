"use client";

import { useMemo, useState } from "react";
import { moodGuides } from "../moodGuides";
import { guideProducts } from "../guideProducts";

const filters = [
  { key: "all", label: "전체 보기" },
  { key: "mood", label: "공간 무드" },
  { key: "color-white", label: "화이트 · 베이지" },
  { key: "color-gray", label: "그레이" },
  { key: "color-dark", label: "다크 · 블랙" },
  { key: "color-wood", label: "우드 톤" },
  { key: "color-green", label: "그린 톤" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

export default function PortfolioGallery() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const galleryResolved = useMemo(
    () =>
      moodGuides.map((mood) => ({
        ...mood,
        products: mood.productIds
          .map((id) => guideProducts.find((p) => p.id === id))
          .filter((p): p is (typeof guideProducts)[number] => Boolean(p)),
      })),
    []
  );

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") return galleryResolved;
    if (activeFilter === "mood") return galleryResolved.filter((item) => item.category === "mood");
    return galleryResolved.filter((item) => item.id === activeFilter);
  }, [activeFilter, galleryResolved]);

  return (
    <>
      <div className="portfolio-filters" role="tablist" aria-label="무드 · 색상 카테고리 필터">
        {filters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.key}
            className={activeFilter === filter.key ? "active" : ""}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="portfolio-grid">
        {visibleItems.map((mood) => (
          <article className="portfolio-card" key={mood.id}>
            <div className="portfolio-card-art" style={{ backgroundImage: `url(${mood.image})` }}>
              <span className="portfolio-card-badge">{mood.category === "mood" ? "무드 참고" : "색상 참고"}</span>
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
    </>
  );
}
