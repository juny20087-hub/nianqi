"use client";

import { DEFAULT_STYLE, STYLES } from "@/lib/styles";

export default function StyleSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-dim">风格预设</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            value === undefined
              ? "border-accent/60 bg-accent/10 text-accent-soft"
              : "border-border bg-background-soft text-dim hover:border-faint"
          }`}
        >
          {DEFAULT_STYLE.name}
        </button>
        {STYLES.map((s) => {
          const active = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              title={s.desc}
              onClick={() => onChange(active ? undefined : s.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-accent/60 bg-accent/10 text-accent-soft"
                  : "border-border bg-background-soft text-dim hover:border-faint"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
