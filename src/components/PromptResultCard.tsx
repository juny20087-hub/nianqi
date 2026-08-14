"use client";

import { useState } from "react";
import type { GenerateOutput } from "@/lib/prompt-engine";

const PLATFORM_META: Record<
  string,
  { name: string; tag: string; color: string }
> = {
  "gpt-image-2": { name: "GPT-Image-2", tag: "ChatGPT", color: "bg-emerald-400" },
  "nano-banana": { name: "Nano Banana", tag: "Gemini", color: "bg-sky-400" },
};

export default function PromptResultCard({ result }: { result: GenerateOutput }) {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [copied, setCopied] = useState(false);
  const meta = PLATFORM_META[result.platform] ?? {
    name: result.platform,
    tag: "",
    color: "bg-accent",
  };
  const text = result.prompt[lang];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 不可用时忽略 */
    }
  };

  return (
    <div className="animate-fade-up flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
          <span className="font-medium text-foreground">{meta.name}</span>
          {meta.tag && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-faint">
              {meta.tag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background-soft p-0.5">
          {(["zh", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                lang === l
                  ? "bg-accent/15 text-accent-soft"
                  : "text-faint hover:text-dim"
              }`}
            >
              {l === "zh" ? "中文" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* 正文 */}
      <div className="flex flex-col gap-3 px-5 py-4">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {text}
        </p>
        <div className="flex items-center justify-between gap-3">
          {result.rationale && (
            <p className="text-xs leading-relaxed text-faint">
              <span className="mr-1 text-accent/70">✦</span>
              {result.rationale}
            </p>
          )}
          <button
            type="button"
            onClick={copy}
            className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs transition-colors ${
              copied
                ? "border-accent/60 bg-accent/15 text-accent-soft"
                : "border-border bg-background-soft text-dim hover:border-accent/50 hover:text-accent-soft"
            }`}
          >
            {copied ? "✓ 已复制" : "⧉ 复制提示词"}
          </button>
        </div>
      </div>
    </div>
  );
}
