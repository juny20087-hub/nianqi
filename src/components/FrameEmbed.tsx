"use client";

import { useState } from "react";

/**
 * 坐标生成页面 —— 内嵌 Coordinate-based Frame Generator
 *
 * 构建产物放在 public/frame-generator/ 下，通过 iframe 加载。
 * Vue3 SPA 与 React 互不干扰，是最干净的集成方式。
 */
export default function FrameEmbed() {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* 页头 */}
      <div className="flex items-center justify-between border-b border-border bg-background-soft/60 px-6 py-4">
        <div>
          <h1 className="font-serif-sc text-xl font-bold text-accent-soft">
            坐标生成
          </h1>
          <p className="mt-0.5 text-xs text-dim">
            Coordinate-based Frame Generator · 拖拽框选生成坐标
          </p>
        </div>
        {failed && (
          <span className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
            加载失败，请确认 frame-generator 构建产物已就位
          </span>
        )}
      </div>

      {/* iframe 容器 */}
      <div className="relative flex-1">
        {!loaded && !failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            <span className="text-sm text-dim">正在加载坐标生成器…</span>
          </div>
        )}
        <iframe
          src="/frame-generator/index.html"
          className="h-full w-full border-0"
          onLoad={() => {
            setLoaded(true);
            setFailed(false);
          }}
          onError={() => setFailed(true)}
          title="Coordinate-based Frame Generator"
          allow="clipboard-write"
        />
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background">
            <span className="text-3xl">🖼️</span>
            <p className="max-w-md text-center text-sm leading-relaxed text-dim">
              坐标生成器加载失败。
              <br />
              请将构建产物放到{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-accent-soft">
                public/frame-generator/
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
