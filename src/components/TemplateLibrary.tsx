"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_META,
  TEMPLATES,
  type PromptTemplate,
  type TemplateCategory,
} from "@/lib/templates";

const CATEGORY_ORDER: (TemplateCategory | "all")[] = [
  "all",
  "character",
  "scene",
  "prop",
  "style",
];

export default function TemplateLibrary({
  onApply,
}: {
  onApply: (text: string, category: TemplateCategory) => void;
}) {
  const [filter, setFilter] = useState<TemplateCategory | "all">("all");
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(
    () =>
      TEMPLATES.filter((t) => filter === "all" || t.category === filter),
    [filter],
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.25em] text-faint">
          提示词模板库
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-faint transition-colors hover:text-accent-soft"
        >
          {expanded ? "收起 ▲" : "展开 ▼"}
        </button>
      </div>

      {expanded && (
        <>
          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  filter === c
                    ? "border-accent/60 bg-accent/10 text-accent-soft"
                    : "border-border bg-background-soft text-dim hover:border-faint"
                }`}
              >
                {c === "all" ? "全部" : CATEGORY_META[c].label}
                <span className="ml-1 text-faint">
                  {c === "all"
                    ? TEMPLATES.length
                    : TEMPLATES.filter((t) => t.category === c).length}
                </span>
              </button>
            ))}
          </div>

          {/* 模板列表 */}
          <div className="grid gap-2 sm:grid-cols-2">
            {visible.map((t) => (
              <TemplateCard key={t.id} template={t} onApply={onApply} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function TemplateCard({
  template,
  onApply,
}: {
  template: PromptTemplate;
  onApply: (text: string, category: TemplateCategory) => void;
}) {
  const meta = CATEGORY_META[template.category];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface/50 p-3.5 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {template.title}
          </span>
          <span
            className={`w-fit rounded-full border px-2 py-0.5 text-[11px] ${meta.color}`}
          >
            {meta.label}
          </span>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-dim">{template.description}</p>
      <div className="mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApply(template.example, template.category)}
          className="flex-1 rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs text-accent-soft transition-colors hover:bg-accent/20"
        >
          套用模板
        </button>
      </div>
    </div>
  );
}
