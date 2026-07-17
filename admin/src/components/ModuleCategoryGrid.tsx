"use client";

import { useMemo } from "react";
import type { ModuleInfo } from "@/lib/api";
import { groupModulesBySection } from "@/lib/moduleSections";

interface ModuleCategoryGridProps {
  modules: ModuleInfo[];
  selected: string[];
  onToggle: (id: string) => void;
  /** Optional bulk setter for section "select all / none". */
  onSetMany?: (ids: string[], checked: boolean) => void;
}

export default function ModuleCategoryGrid({
  modules,
  selected,
  onToggle,
  onSetMany,
}: ModuleCategoryGridProps) {
  const sections = useMemo(() => groupModulesBySection(modules), [modules]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="stack" style={{ gap: "1.1rem" }}>
      {sections.map((section) => {
        const ids = section.modules.map((m) => m.id);
        const allOn = ids.every((id) => selectedSet.has(id));
        const someOn = ids.some((id) => selectedSet.has(id));
        return (
          <div key={section.id}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "0.5rem",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.92rem" }}>{section.title}</strong>{" "}
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  {section.description} · {ids.filter((id) => selectedSet.has(id)).length}/
                  {ids.length}
                </span>
              </div>
              {onSetMany ? (
                <button
                  type="button"
                  className="btn secondary"
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                  onClick={() => onSetMany(ids, !allOn)}
                >
                  {allOn ? "Бүгдийг цуцлах" : someOn ? "Бүгдийг сонгох" : "Бүгдийг сонгох"}
                </button>
              ) : null}
            </div>
            <div className="module-grid">
              {section.modules.map((m) => (
                <label key={m.id} className="module-item">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(m.id)}
                    onChange={() => onToggle(m.id)}
                  />
                  <span>
                    <strong style={{ display: "block" }}>{m.label}</strong>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      {m.id}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
