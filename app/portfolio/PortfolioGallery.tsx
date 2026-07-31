"use client";

import { useEffect, useMemo, useState } from "react";
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

type Lightbox = { title: string; images: readonly string[]; index: number };

export default function PortfolioGallery() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);

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

  function openLightbox(title: string, images: readonly string[]) {
    setLightbox({ title, images, index: 0 });
  }

  useEffect(() => {
    if (!lightbox) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowLeft") stepLightbox(-1);
      if (event.key === "ArrowRight") stepLightbox(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox]);

  function stepLightbox(delta: number) {
    setLightbox((current) => {
      if (!current) return current;
      const next = (current.index + delta + current.images.length) % current.images.length;
      return { ...current, index: next };
    });
  }

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
            <button
              type="button"
              className="portfolio-card-art"
              style={{ backgroundImage: `url(${mood.image})` }}
              onClick={() => openLightbox(mood.label, mood.gallery)}
              aria-label={`${mood.label} 사진 크게 보기`}
            >
              <span className="portfolio-card-badge">{mood.category === "mood" ? "무드 참고" : "색상 참고"}</span>
              {mood.gallery.length > 1 && <span className="portfolio-card-count">사진 {mood.gallery.length}장 · 눌러서 보기</span>}
              <span className="portfolio-card-credit">사진 · {mood.imageCredit}</span>
            </button>
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
              <a
                className="portfolio-card-cta"
                href={`/?mood=${encodeURIComponent(mood.label)}#reservation`}
                target="_blank"
                rel="noreferrer"
              >
                이 무드로 상담하기 <span>↗</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      {lightbox && (
        <div className="portfolio-lightbox" role="dialog" aria-modal="true" aria-label={`${lightbox.title} 사진`} onClick={() => setLightbox(null)}>
          <button type="button" className="portfolio-lightbox-close" onClick={() => setLightbox(null)} aria-label="닫기">
            ✕
          </button>
          <div className="portfolio-lightbox-body" onClick={(event) => event.stopPropagation()}>
            {lightbox.images.length > 1 && (
              <button type="button" className="portfolio-lightbox-nav prev" onClick={() => stepLightbox(-1)} aria-label="이전 사진">
                ‹
              </button>
            )}
            <img src={lightbox.images[lightbox.index]} alt={`${lightbox.title} 참고 사진`} className="portfolio-lightbox-image" />
            {lightbox.images.length > 1 && (
              <button type="button" className="portfolio-lightbox-nav next" onClick={() => stepLightbox(1)} aria-label="다음 사진">
                ›
              </button>
            )}
          </div>
          <div className="portfolio-lightbox-caption">
            {lightbox.title}
            {lightbox.images.length > 1 && ` · ${lightbox.index + 1} / ${lightbox.images.length}`}
          </div>
        </div>
      )}
    </>
  );
}
