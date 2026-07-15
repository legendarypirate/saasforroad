"use client";

import { useEffect } from "react";
import {
  PLATFORM_DATA_MODULES,
  PLATFORM_ERP_MODULES,
} from "@/lib/platformCatalog";
import "./PlatformLanding.css";

export default function PlatformLanding() {
  useEffect(() => {
    document.title = "RCOS — Замын салбарын SaaS платформ";
  }, []);

  return (
    <main className="pl-root">
      <div className="pl-glow" aria-hidden />

      <header className="pl-nav">
        <div className="pl-brand">
          <span className="pl-mark">R</span>
          <span className="pl-brand-text">RCOS</span>
        </div>
        <div className="pl-nav-actions">
          <a className="pl-link" href="#modules">
            Модуль
          </a>
          <a className="pl-link" href="#data">
            Өгөгдөл
          </a>
          <a className="pl-btn pl-btn-ghost" href="https://admin.rcos.mn">
            Platform admin
          </a>
        </div>
      </header>

      <section className="pl-hero">
        <p className="pl-eyebrow">rcos.mn</p>
        <h1 className="pl-title">RCOS</h1>
        <p className="pl-lead">
          Замын барилга, ашиглалт, ХАБЭА, санхүү, хүний нөөцийг нэг SaaS
          тавцан дээр — компани бүр өөрийн домэйн дээр ажиллана.
        </p>
        <div className="pl-cta">
          <a className="pl-btn" href="https://admin.rcos.mn">
            Платформ нэвтрэх
          </a>
          <a className="pl-btn pl-btn-secondary" href="#modules">
            Модуль үзэх
          </a>
        </div>
      </section>

      <section className="pl-section" id="modules">
        <h2 className="pl-h2">ERP модулиуд</h2>
        <p className="pl-section-desc">
          Платформ админ компани бүрт эдгээр модулийг асааж/унтрааж өгнө. Түрээсийн
          систем нь {`{slug}.rcos.mn`} эсвэл захиалгат домэйн дээр ажиллана.
        </p>
        <ul className="pl-list">
          {PLATFORM_ERP_MODULES.map((m) => (
            <li key={m.id} className="pl-row">
              <div>
                <strong>{m.label}</strong>
                <span className="pl-id">{m.id}</span>
              </div>
              <p>{m.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pl-section" id="data">
        <h2 className="pl-h2">Өгөгдлийн сангууд</h2>
        <p className="pl-section-desc">
          Салбарын нийтлэг өгөгдөл — үйлдвэр, техник, бригад, лаборатори гэх мэт.
          Модуль эрхээр нээгдэнэ.
        </p>
        <ul className="pl-list pl-list-dense">
          {PLATFORM_DATA_MODULES.map((m) => (
            <li key={m.id} className="pl-row">
              <div>
                <strong>{m.label}</strong>
                <span className="pl-id">{m.id}</span>
              </div>
              <p>{m.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="pl-section pl-how">
        <h2 className="pl-h2">Хэрхэн ажилладаг вэ</h2>
        <ol className="pl-steps">
          <li>
            <strong>Бүртгэл</strong>
            <span>admin.rcos.mn дээр компани (tenant) үүсгэнэ.</span>
          </li>
          <li>
            <strong>Домэйн</strong>
            <span>
              Шууд <code>company.rcos.mn</code> — эсвэл өөрийн домэйн (A record).
            </span>
          </li>
          <li>
            <strong>Модуль + эрх</strong>
            <span>Модуль асааж, супер админ / роль permission тохируулна.</span>
          </li>
        </ol>
      </section>

      <footer className="pl-foot">
        <span>RCOS Platform</span>
        <a href="https://admin.rcos.mn">admin.rcos.mn</a>
        <a href="mailto:admin@rcos.mn">admin@rcos.mn</a>
      </footer>
    </main>
  );
}
