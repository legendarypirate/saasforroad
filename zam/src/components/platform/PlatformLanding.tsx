"use client";

import { useEffect, useMemo, useState } from "react";
import {
  enabledItems,
  FALLBACK_PLATFORM_LANDING,
  fetchPlatformLanding,
  type PlatformLandingContent,
} from "@/lib/platformLanding";
import {
  DataItemIcon,
  PlatformThemeToggle,
  usePlatformTheme,
} from "@/components/platform/PlatformTheme";
import "./PlatformLanding.css";

function resolveHeroSlides(content: PlatformLandingContent): string[] {
  const slides = Array.isArray(content.hero_images)
    ? content.hero_images.filter(Boolean)
    : [];
  if (slides.length) return slides.slice(0, 3);
  return content.hero_image ? [content.hero_image] : [];
}

export default function PlatformLanding() {
  const [content, setContent] = useState<PlatformLandingContent>(
    FALLBACK_PLATFORM_LANDING
  );
  const [ready, setReady] = useState(false);
  const [slide, setSlide] = useState(0);
  const { theme, toggle } = usePlatformTheme();

  useEffect(() => {
    let cancelled = false;
    fetchPlatformLanding().then((data) => {
      if (cancelled) return;
      setContent(data);
      setReady(true);
      document.title = data.meta_title || data.brand_name || "RCOS";
      const desc = document.querySelector('meta[name="description"]');
      if (desc && data.meta_description) {
        desc.setAttribute("content", data.meta_description);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => resolveHeroSlides(content), [content]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    setSlide(0);
  }, [slides.join("|")]);

  const modules = enabledItems(content.modules);
  const dataItems = enabledItems(content.data_items);

  return (
    <main
      className={`pl-root${ready ? " pl-ready" : ""}`}
      data-theme={theme}
    >
      <div className="pl-atmosphere" aria-hidden />

      <header className="pl-nav">
        <div className="pl-brand">
          <span className="pl-mark">
            {(content.brand_name || "R").charAt(0)}
          </span>
          <div>
            <div className="pl-brand-text">{content.brand_name || "RCOS"}</div>
            {content.tagline ? (
              <div className="pl-brand-tag">{content.tagline}</div>
            ) : null}
          </div>
        </div>
        <div className="pl-nav-actions">
          <a className="pl-link" href="#modules">
            {content.modules_title || "Модуль"}
          </a>
          <a className="pl-link" href="#data">
            {content.data_title || "Дата мэдээлэл"}
          </a>
          <PlatformThemeToggle theme={theme} onToggle={toggle} />
          <a
            className="pl-btn pl-btn-ghost"
            href={content.admin_url || "https://admin.rcos.mn"}
          >
            Platform admin
          </a>
        </div>
      </header>

      <section className="pl-hero">
        <div className="pl-hero-slides" aria-hidden>
          {slides.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={`pl-hero-slide${i === slide ? " is-active" : ""}`}
              style={{ backgroundImage: `url(${url})` }}
            />
          ))}
          <div className="pl-hero-wash" />
        </div>

        <div className="pl-hero-inner">
          {content.hero_eyebrow ? (
            <p className="pl-eyebrow">{content.hero_eyebrow}</p>
          ) : null}
          <h1 className="pl-title">{content.brand_name || "RCOS"}</h1>
          {content.hero_title ? (
            <p className="pl-headline">{content.hero_title}</p>
          ) : null}
          {content.hero_subtitle ? (
            <p className="pl-lead">{content.hero_subtitle}</p>
          ) : null}
          <div className="pl-cta">
            {content.cta_primary_label ? (
              <a className="pl-btn" href={content.cta_primary_url || "#"}>
                {content.cta_primary_label}
              </a>
            ) : null}
            {content.cta_secondary_label ? (
              <a
                className="pl-btn pl-btn-secondary"
                href={content.cta_secondary_url || "#modules"}
              >
                {content.cta_secondary_label}
              </a>
            ) : null}
          </div>
          {slides.length > 1 ? (
            <div className="pl-hero-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`pl-hero-dot${i === slide ? " is-active" : ""}`}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {content.stats?.length ? (
        <section className="pl-stats" aria-label="Stats">
          {content.stats.map((s, i) => (
            <div key={i} className="pl-stat">
              <div className="pl-stat-value">{s.value}</div>
              <div className="pl-stat-label">{s.label}</div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="pl-section" id="modules">
        <div className="pl-section-head">
          <h2 className="pl-h2">{content.modules_title}</h2>
          {content.modules_subtitle ? (
            <p className="pl-section-desc">{content.modules_subtitle}</p>
          ) : null}
        </div>
        <ul className="pl-grid">
          {modules.map((m) => (
            <li key={m.id} className="pl-tile">
              <strong>{m.label}</strong>
              <p>{m.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pl-section pl-section-alt" id="data">
        <div className="pl-section-head">
          <h2 className="pl-h2">{content.data_title}</h2>
          {content.data_subtitle ? (
            <p className="pl-section-desc">{content.data_subtitle}</p>
          ) : null}
        </div>
        <ul className="pl-data-grid">
          {dataItems.map((m) => (
            <li key={m.id} className="pl-data-card">
              <div className="pl-data-icon" aria-hidden>
                <DataItemIcon id={m.id} />
              </div>
              <div className="pl-data-copy">
                <strong>{m.label}</strong>
                <p>{m.blurb}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="pl-section" id="how">
        <div className="pl-section-head">
          <h2 className="pl-h2">{content.steps_title}</h2>
        </div>
        <ol className="pl-steps">
          {(content.steps || []).map((step, i) => (
            <li key={i}>
              <span className="pl-step-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="pl-foot">
        <span>{content.footer_text || content.brand_name}</span>
        {content.admin_url ? (
          <a href={content.admin_url}>
            {content.admin_url.replace(/^https?:\/\//, "")}
          </a>
        ) : null}
        {content.contact_email ? (
          <a href={`mailto:${content.contact_email}`}>{content.contact_email}</a>
        ) : null}
      </footer>
    </main>
  );
}
