"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import {
  api,
  PlatformLandingContent,
  PlatformLandingItem,
  PlatformLandingStat,
  PlatformLandingStep,
} from "@/lib/api";

function emptyItem(): PlatformLandingItem {
  return {
    id: `item-${Date.now()}`,
    label: "",
    blurb: "",
    enabled: true,
  };
}

function emptyStat(): PlatformLandingStat {
  return { value: "", label: "" };
}

function emptyStep(): PlatformLandingStep {
  return { title: "", text: "" };
}

function normalizeHeroImages(content: PlatformLandingContent): string[] {
  const slides = Array.isArray(content.hero_images)
    ? content.hero_images.filter(Boolean)
    : [];
  if (slides.length) return slides.slice(0, 3);
  return content.hero_image ? [content.hero_image] : [];
}

type ItemKey = "modules" | "data_items";

export default function LandingEditorPage() {
  const [content, setContent] = useState<PlatformLandingContent | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .getLanding()
      .then((res) => {
        const data = res.data;
        const hero_images = normalizeHeroImages(data);
        setContent({
          ...data,
          hero_images,
          hero_image: hero_images[0] || "",
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, []);

  function patch<K extends keyof PlatformLandingContent>(
    key: K,
    value: PlatformLandingContent[K]
  ) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function setHeroImages(images: string[]) {
    const next = images.filter(Boolean).slice(0, 3);
    setContent((prev) =>
      prev
        ? { ...prev, hero_images: next, hero_image: next[0] || "" }
        : prev
    );
  }

  function updateItem(
    listKey: ItemKey,
    index: number,
    field: keyof PlatformLandingItem,
    value: string | boolean
  ) {
    setContent((prev) => {
      if (!prev) return prev;
      const list = [...prev[listKey]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [listKey]: list };
    });
  }

  function moveItem(listKey: ItemKey, index: number, dir: -1 | 1) {
    setContent((prev) => {
      if (!prev) return prev;
      const list = [...prev[listKey]];
      const next = index + dir;
      if (next < 0 || next >= list.length) return prev;
      [list[index], list[next]] = [list[next], list[index]];
      return { ...prev, [listKey]: list };
    });
  }

  function removeItem(listKey: ItemKey, index: number) {
    setContent((prev) => {
      if (!prev) return prev;
      return { ...prev, [listKey]: prev[listKey].filter((_, i) => i !== index) };
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!content) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      setError("Зөвхөн зураг файл оруулна уу");
      return;
    }
    const current = normalizeHeroImages(content);
    const room = 3 - current.length;
    if (room <= 0) {
      setError("Хамгийн ихдээ 3 зураг");
      return;
    }
    const toUpload = list.slice(0, room);
    setUploading(true);
    setError("");
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const res = await api.uploadLandingImage(file);
        urls.push(res.data.url || res.data.path);
      }
      setHeroImages([...current, ...urls]);
      setMessage(
        toUpload.length === 1
          ? "Hero slide uploaded"
          : `${toUpload.length} slides uploaded`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onHeroDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  function reorderHero(from: number, to: number) {
    if (!content || from === to) return;
    const slides = [...normalizeHeroImages(content)];
    const [item] = slides.splice(from, 1);
    slides.splice(to, 0, item);
    setHeroImages(slides);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        ...content,
        hero_images: normalizeHeroImages(content),
        hero_image: normalizeHeroImages(content)[0] || "",
      };
      const res = await api.updateLanding(payload);
      const hero_images = normalizeHeroImages(res.data);
      setContent({
        ...res.data,
        hero_images,
        hero_image: hero_images[0] || "",
      });
      setMessage("Landing page saved — live on rcos.mn");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <p className="muted">Loading landing CMS…</p>
      </Shell>
    );
  }

  if (!content) {
    return (
      <Shell>
        <p className="error">{error || "No content"}</p>
      </Shell>
    );
  }

  const heroSlides = normalizeHeroImages(content);

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform landing</h1>
          <p className="page-desc">
            Controls <code>https://rcos.mn</code> — save here, no deploy needed for copy.
          </p>
        </div>
        <a
          className="btn secondary"
          href="https://rcos.mn"
          target="_blank"
          rel="noreferrer"
        >
          Open rcos.mn
        </a>
      </div>

      {message ? <p className="flash-ok">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <form className="stack" onSubmit={onSubmit}>
        <section className="panel">
          <h2 className="panel-title">Brand / SEO</h2>
          <div className="grid-2" style={{ marginTop: "0.85rem" }}>
            <div className="field">
              <label>Brand name</label>
              <input
                value={content.brand_name}
                onChange={(e) => patch("brand_name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Tagline</label>
              <input
                value={content.tagline}
                onChange={(e) => patch("tagline", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Meta title</label>
              <input
                value={content.meta_title}
                onChange={(e) => patch("meta_title", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Meta description</label>
              <input
                value={content.meta_description}
                onChange={(e) => patch("meta_description", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">Hero</h2>
          <div className="grid-2" style={{ marginTop: "0.85rem" }}>
            <div className="field">
              <label>Eyebrow</label>
              <input
                value={content.hero_eyebrow}
                onChange={(e) => patch("hero_eyebrow", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Title</label>
              <input
                value={content.hero_title}
                onChange={(e) => patch("hero_title", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Subtitle</label>
            <textarea
              rows={2}
              value={content.hero_subtitle}
              onChange={(e) => patch("hero_subtitle", e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: "0.35rem" }}>
            <label>Background slides (1–3)</label>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              Drag &amp; drop images below, or reorder thumbnails. Max 3.
            </p>
          </div>

          <div
            className={`hero-dropzone${dragOver ? " is-over" : ""}${uploading ? " is-busy" : ""}`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragOver(false);
            }}
            onDrop={onHeroDrop}
            onClick={() => {
              if (!uploading && heroSlides.length < 3) fileInputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (heroSlides.length < 3) fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={uploading || heroSlides.length >= 3}
              onChange={(e) => {
                if (e.target.files?.length) void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="hero-dropzone-inner">
              <strong>
                {uploading
                  ? "Uploading…"
                  : heroSlides.length >= 3
                    ? "Slide limit reached (3)"
                    : "Drop images here"}
              </strong>
              <span>
                {heroSlides.length}/3 · PNG, JPG, WebP · click to browse
              </span>
            </div>
          </div>

          {heroSlides.length ? (
            <ul className="hero-thumbs">
              {heroSlides.map((url, i) => (
                <li
                  key={`${url}-${i}`}
                  className={`hero-thumb${dragIndex === i ? " is-dragging" : ""}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => setDragIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragIndex !== null) reorderHero(dragIndex, i);
                    setDragIndex(null);
                  }}
                >
                  <img src={url} alt={`Slide ${i + 1}`} />
                  <div className="hero-thumb-meta">
                    <span>#{i + 1}</span>
                    <button
                      type="button"
                      className="btn ghost chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroImages(heroSlides.filter((_, j) => j !== i));
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="grid-2" style={{ marginTop: "0.75rem" }}>
            <div className="field">
              <label>Primary CTA label</label>
              <input
                value={content.cta_primary_label}
                onChange={(e) => patch("cta_primary_label", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Primary CTA URL</label>
              <input
                value={content.cta_primary_url}
                onChange={(e) => patch("cta_primary_url", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Secondary CTA label</label>
              <input
                value={content.cta_secondary_label}
                onChange={(e) => patch("cta_secondary_label", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Secondary CTA URL</label>
              <input
                value={content.cta_secondary_url}
                onChange={(e) => patch("cta_secondary_url", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Stats (below hero)</h2>
            <button
              type="button"
              className="btn secondary chip"
              onClick={() => patch("stats", [...content.stats, emptyStat()])}
            >
              Add stat
            </button>
          </div>
          {content.stats.map((s, i) => (
            <div key={i} className="grid-2" style={{ alignItems: "end" }}>
              <div className="field">
                <label>Value</label>
                <input
                  value={s.value}
                  onChange={(e) => {
                    const stats = [...content.stats];
                    stats[i] = { ...stats[i], value: e.target.value };
                    patch("stats", stats);
                  }}
                />
              </div>
              <div className="field">
                <label>Label</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    style={{ flex: 1 }}
                    value={s.label}
                    onChange={(e) => {
                      const stats = [...content.stats];
                      stats[i] = { ...stats[i], label: e.target.value };
                      patch("stats", stats);
                    }}
                  />
                  <button
                    type="button"
                    className="btn ghost chip"
                    onClick={() =>
                      patch(
                        "stats",
                        content.stats.filter((_, j) => j !== i)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <ItemListEditor
          title="ERP modules"
          titleValue={content.modules_title}
          subtitleValue={content.modules_subtitle}
          onTitle={(v) => patch("modules_title", v)}
          onSubtitle={(v) => patch("modules_subtitle", v)}
          items={content.modules}
          onAdd={() => patch("modules", [...content.modules, emptyItem()])}
          onChange={(i, field, value) => updateItem("modules", i, field, value)}
          onMove={(i, dir) => moveItem("modules", i, dir)}
          onRemove={(i) => removeItem("modules", i)}
        />

        <ItemListEditor
          title="Data sections"
          titleValue={content.data_title}
          subtitleValue={content.data_subtitle}
          onTitle={(v) => patch("data_title", v)}
          onSubtitle={(v) => patch("data_subtitle", v)}
          items={content.data_items}
          onAdd={() => patch("data_items", [...content.data_items, emptyItem()])}
          onChange={(i, field, value) =>
            updateItem("data_items", i, field, value)
          }
          onMove={(i, dir) => moveItem("data_items", i, dir)}
          onRemove={(i) => removeItem("data_items", i)}
        />

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">How it works</h2>
              <div
                className="field"
                style={{ marginTop: "0.75rem", marginBottom: 0 }}
              >
                <label>Section title</label>
                <input
                  value={content.steps_title}
                  onChange={(e) => patch("steps_title", e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn secondary chip"
              onClick={() => patch("steps", [...content.steps, emptyStep()])}
            >
              Add step
            </button>
          </div>
          {content.steps.map((step, i) => (
            <div key={i} style={{ marginBottom: "0.75rem" }}>
              <div className="grid-2">
                <div className="field">
                  <label>Title</label>
                  <input
                    value={step.title}
                    onChange={(e) => {
                      const steps = [...content.steps];
                      steps[i] = { ...steps[i], title: e.target.value };
                      patch("steps", steps);
                    }}
                  />
                </div>
                <div className="field">
                  <label>Text</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      style={{ flex: 1 }}
                      value={step.text}
                      onChange={(e) => {
                        const steps = [...content.steps];
                        steps[i] = { ...steps[i], text: e.target.value };
                        patch("steps", steps);
                      }}
                    />
                    <button
                      type="button"
                      className="btn ghost chip"
                      onClick={() =>
                        patch(
                          "steps",
                          content.steps.filter((_, j) => j !== i)
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          <h2 className="panel-title">Footer</h2>
          <div className="grid-2" style={{ marginTop: "0.85rem" }}>
            <div className="field">
              <label>Footer text</label>
              <input
                value={content.footer_text}
                onChange={(e) => patch("footer_text", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Contact email</label>
              <input
                value={content.contact_email}
                onChange={(e) => patch("contact_email", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Admin URL</label>
              <input
                value={content.admin_url}
                onChange={(e) => patch("admin_url", e.target.value)}
              />
            </div>
          </div>
        </section>

        <button className="btn" type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : "Save landing page"}
        </button>
      </form>
    </Shell>
  );
}

function ItemListEditor({
  title,
  titleValue,
  subtitleValue,
  onTitle,
  onSubtitle,
  items,
  onAdd,
  onChange,
  onMove,
  onRemove,
}: {
  title: string;
  titleValue: string;
  subtitleValue: string;
  onTitle: (v: string) => void;
  onSubtitle: (v: string) => void;
  items: PlatformLandingItem[];
  onAdd: () => void;
  onChange: (
    i: number,
    field: keyof PlatformLandingItem,
    value: string | boolean
  ) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2 className="panel-title">{title}</h2>
        <button type="button" className="btn secondary chip" onClick={onAdd}>
          Add item
        </button>
      </div>
      <div className="field">
        <label>Section title</label>
        <input value={titleValue} onChange={(e) => onTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Section subtitle</label>
        <textarea
          rows={2}
          value={subtitleValue}
          onChange={(e) => onSubtitle(e.target.value)}
        />
      </div>
      {items.map((item, i) => (
        <div
          key={item.id || i}
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: "0.85rem",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "0.5rem",
            }}
          >
            <label
              className="muted"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => onChange(i, "enabled", e.target.checked)}
              />
              Visible
            </label>
            <button
              type="button"
              className="btn ghost chip"
              onClick={() => onMove(i, -1)}
            >
              Up
            </button>
            <button
              type="button"
              className="btn ghost chip"
              onClick={() => onMove(i, 1)}
            >
              Down
            </button>
            <button
              type="button"
              className="btn ghost chip"
              onClick={() => onRemove(i)}
            >
              Remove
            </button>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Id</label>
              <input
                value={item.id}
                onChange={(e) => onChange(i, "id", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Label</label>
              <input
                value={item.label}
                onChange={(e) => onChange(i, "label", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Blurb</label>
            <textarea
              rows={2}
              value={item.blurb}
              onChange={(e) => onChange(i, "blurb", e.target.value)}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
