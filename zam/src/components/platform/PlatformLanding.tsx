"use client";

import { useEffect, useState } from "react";
import {
  enabledItems,
  FALLBACK_PLATFORM_LANDING,
  fetchPlatformLanding,
  type PlatformLandingContent,
} from "@/lib/platformLanding";
import "./PlatformLanding.css";

export default function PlatformLanding() {
  const [content, setContent] = useState<PlatformLandingContent>(
    FALLBACK_PLATFORM_LANDING
  );
  const [ready, setReady] = useState(false);

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

  const modules = enabledItems(content.modules);
  const dataItems = enabledItems(content.data_items);
  const heroStyle = content.hero_image
    ? {
        backgroundImage: `linear-gradient(105deg, rgba(9,13,17,0.92) 0%, rgba(9,13,17,0.55) 45%, rgba(9,13,17,0.35) 100%), url(${content.hero_image})`,
      }
    : undefined;

  return (
    <main className={`pl-root${ready ? " pl-ready" : ""}`}>
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
            {content.data_title || "Өгөгдөл"}
          </a>
          <a
            className="pl-btn pl-btn-ghost"
            href={content.admin_url || "https://admin.rcos.mn"}
          >
            Platform admin
          </a>
        </div>
      </header>

      <section className="pl-hero" style={heroStyle}>
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
        <ul className="pl-rail">
          {dataItems.map((m) => (
            <li key={m.id} className="pl-rail-item">
              <strong>{m.label}</strong>
              <span>{m.blurb}</span>
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
              <span className="pl-step-num">{String(i + 1).padStart(2, "0")}</span>
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
          <a href={content.admin_url}>{content.admin_url.replace(/^https?:\/\//, "")}</a>
        ) : null}
        {content.contact_email ? (
          <a href={`mailto:${content.contact_email}`}>{content.contact_email}</a>
        ) : null}
      </footer>
    </main>
  );
}
