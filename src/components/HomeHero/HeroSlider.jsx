import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./HeroSection.css";

function normalizeApiArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function resolveImageUrl(API_BASE, raw) {
  const val = (raw || "").trim();

  if (!val) return "";

  if (val.startsWith("http://") || val.startsWith("https://")) {
    return val;
  }

  return `${API_BASE}/${val.replace(/^\/+/, "")}`;
}

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = useMemo(() => {
    const base = import.meta.env.VITE_APP_SERVER_URL || "http://localhost:5000";

    return base.replace(/\/$/, "");
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBanners = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/banners`, {
          signal: controller.signal,
        });

        const payload = await res.json();

        const mapped = normalizeApiArray(payload)
          .map((banner) => ({
            id: banner._id || banner.id || banner.imageUrl,

            img: resolveImageUrl(API_BASE, banner.imageUrl),

            title: banner.title || "",
            to: banner.to || "/shop",
          }))
          .filter((item) => item.img);

        setSlides(mapped);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Banner fetch error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();

    return () => {
      controller.abort();
    };
  }, [API_BASE]);

  const NextArrow = ({ onClick }) => (
    <button
      className="hero-arrow hero-arrow--next hidden md:flex"
      onClick={onClick}
      aria-label="Next"
      type="button"
    >
      ›
    </button>
  );

  const PrevArrow = ({ onClick }) => (
    <button
      className="hero-arrow hero-arrow--prev hidden md:flex"
      onClick={onClick}
      aria-label="Previous"
      type="button"
    >
      ‹
    </button>
  );

  const settings = {
    dots: true,
    infinite: slides.length > 1,
    speed: 350,
    fade: false,
    autoplay: slides.length > 1,
    autoplaySpeed: 2500,
    cssEase: "ease-out",
    lazyLoad: "ondemand",
    pauseOnHover: true,
    swipeToSlide: true,
    touchThreshold: 10,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 640,
        settings: {
          arrows: false,
          dots: true,
        },
      },
    ],
  };

  if (loading) {
    return (
      <section className="hero-wrap">
        <div className="w-full h-[200px] md:h-[460px] rounded-xl bg-gray-100 animate-pulse" />
      </section>
    );
  }

  if (!slides.length) {
    return null;
  }

  return (
    <section className="hero-wrap">
      <div className="w-full">
        <div className="bg-white rounded-xl overflow-hidden">
          <Slider {...settings}>
            {slides.map((slide, index) => (
              <div key={slide.id}>
                <img
                  src={slide.img}
                  alt={slide.title || `Banner ${index + 1}`}
                  className="w-full h-auto object-contain"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                />

                {/* w-full h-auto object-contain */}
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}
