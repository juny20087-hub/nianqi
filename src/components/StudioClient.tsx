"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PromptResultCard from "./PromptResultCard";
import TemplateLibrary from "./TemplateLibrary";
import StyleSelector from "./StyleSelector";
import {
  FRAME_OUTPUT_EVENT,
  getFrameOutput,
  type FrameOutput,
} from "@/lib/frame-store";
import type {
  AssetType,
  GenerateOutput,
  TargetPlatform,
} from "@/lib/prompt-engine";
import type { TemplateCategory } from "@/lib/templates";
import { STYLES } from "@/lib/styles";

const PLATFORMS: { id: TargetPlatform; name: string; tag: string }[] = [
  { id: "gpt-image-2", name: "GPT-Image-2", tag: "ChatGPT" },
  { id: "nano-banana", name: "Nano Banana", tag: "Gemini" },
];

const ASSET_TYPES: { id: AssetType; name: string; desc: string }[] = [
  { id: undefined, name: "通用生图", desc: "自由创作" },
  { id: "character", name: "人物资产", desc: "角色/生物设计" },
  { id: "scene", name: "场景资产", desc: "环境/箱庭" },
  { id: "prop", name: "道具资产", desc: "武器/物件" },
];

const EXAMPLES = [
  "一只戴着圆框眼镜的橘猫，穿着复古侦探风衣，坐在深夜图书馆的台灯下翻一本泛黄的旧书，暖黄色灯光，电影感氛围",
  "未来城市的雨夜街头，霓虹灯倒映在湿漉漉的柏油路上，一个撑着透明伞的女孩背影，赛博朋克风格，电影海报构图",
  "雪山之巅的日出时分，金色的阳光洒在云海上，一只雄鹰展翅飞过，史诗级风光摄影，超广角",
  "一位白发老奶奶在院子里做桂花糕，阳光透过树叶洒下斑驳光影，温馨治愈的日系生活摄影风格",
  "月球表面，一名宇航员蹲下来把一朵红色玫瑰花种在灰色土壤里，身后是蓝色的地球，画面带有浪漫的诗意",
];

interface HistoryItem {
  id: string;
  description: string;
  platforms: TargetPlatform[];
  assetType?: AssetType;
  styleId?: string;
  createdAt: number;
}

const HISTORY_KEY = "nianqi-history";

export default function StudioClient() {
  const [description, setDescription] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [platforms, setPlatforms] = useState<TargetPlatform[]>([
    "gpt-image-2",
    "nano-banana",
  ]);
  const [assetType, setAssetType] = useState<AssetType>(undefined);
  const [styleId, setStyleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<GenerateOutput[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [frameOutput, setFrameOutput] = useState<FrameOutput | null>(null);
  const [frameImported, setFrameImported] = useState(false);
  const [rightTab, setRightTab] = useState<"result" | "inspire" | "history">(
    "result",
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Ctrl/⌘ + Enter 快速生成
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        handleGenerate();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, extraNotes, platforms, assetType, styleId]);

  // 常用补充要求预设
  const EXTRA_PRESETS = [
    "电影感：单主光源，low-key 布光，35mm 胶片颗粒",
    "黄金时刻光线，长阴影，暖色调",
    "夜景霓虹，青橙对比，湿街反光",
    "浅景深，85mm 人像镜头，背景虚化",
    "不要水印，不要文字，不要签名",
    "主体清晰，背景压暗，突出人物",
  ];

  const applyExtraPreset = (preset: string) => {
    setExtraNotes((prev) => {
      const base = prev.trim();
      return base ? `${base}；${preset}` : preset;
    });
  };

  // 读取本地历史
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  // 读取坐标页同步的坐标输出，并监听变化
  useEffect(() => {
    const read = () => setFrameOutput(getFrameOutput());
    read();
    window.addEventListener(FRAME_OUTPUT_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(FRAME_OUTPUT_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const importFrameOutput = useCallback(() => {
    if (!frameOutput?.text) return;
    const coords = frameOutput.text.trim();
    if (!coords) return;
    setExtraNotes((prev) => {
      const base = prev.trim();
      const coordLine = `画面构图坐标（L/T/W/H）：\n${coords}`;
      return base ? `${base}\n${coordLine}` : coordLine;
    });
    setFrameImported(true);
    setTimeout(() => setFrameImported(false), 2000);
  }, [frameOutput]);

  const togglePlatform = (p: TargetPlatform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const handleGenerate = useCallback(async () => {
    const desc = description.trim();
    if (!desc) {
      setError("请先描述你想生成的画面");
      return;
    }
    if (platforms.length === 0) {
      setError("请至少选择一个目标平台");
      return;
    }
    setError("");
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          platforms,
          extraNotes: extraNotes.trim() || undefined,
          assetType,
          styleId,
        }),
      });
      const data = (await res.json()) as {
        results?: GenerateOutput[];
        error?: string;
      };
      if (!res.ok || !data.results) {
        throw new Error(data.error ?? "生成失败");
      }
      setResults(data.results);
      setRightTab("result");
      // 写入历史
      const item: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        description: desc,
        platforms,
        assetType,
        styleId,
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 20);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, [description, extraNotes, platforms, assetType, styleId]);

  return (
    <div className="relative flex-1">
      {/* 夜空氛围层（vignette + 噪点，fixed 不随滚动） */}
      <div className="night-ambient" aria-hidden />
      {/* 夜空星点背景 */}
      <Stars />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* 品牌区（精简为顶部横条） */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif-sc text-3xl font-bold tracking-[0.3em] text-accent-soft sm:text-4xl">
              廿七
            </span>
            <span className="h-5 w-px bg-border" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-dim">提示词工坊</span>
              <span className="text-[11px] text-faint">
                第二十七夜 · 让想象成像
              </span>
            </div>
          </div>
          <p className="hidden max-w-md text-right text-xs leading-relaxed text-faint md:block">
            说出你脑海里的画面，我把它翻译成{" "}
            <span className="text-accent-soft">GPT-Image-2</span> 与{" "}
            <span className="text-accent-soft">Nano Banana</span> 都能读懂的专业提示词
          </p>
        </header>

        {/* 双栏工坊 */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* 左栏 · 工作台（sticky） */}
          <section className="flex w-full shrink-0 flex-col gap-5 rounded-2xl border border-border bg-surface/80 p-5 shadow-[0_0_60px_rgba(212,168,87,0.06)] backdrop-blur lg:sticky lg:top-6 lg:w-[420px]">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-dim"
              >
                描述你想生成的画面
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：一只戴着圆框眼镜的橘猫，穿着复古侦探风衣，坐在深夜图书馆的台灯下翻一本泛黄的旧书……"
                rows={5}
                className="w-full resize-y rounded-xl border border-border bg-background-soft px-4 py-3 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent/50"
              />
            </div>

            {/* 资产类型选择 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-dim">生成模式</span>
              <div className="grid grid-cols-2 gap-2">
                {ASSET_TYPES.map((a) => {
                  const active = assetType === a.id;
                  return (
                    <button
                      key={a.id ?? "general"}
                      type="button"
                      onClick={() => setAssetType(a.id)}
                      className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-accent/60 bg-accent/10"
                          : "border-border bg-background-soft hover:border-faint"
                      }`}
                    >
                      <span
                        className={`text-sm ${
                          active ? "text-accent-soft" : "text-foreground"
                        }`}
                      >
                        {a.name}
                      </span>
                      <span className="text-[11px] text-faint">{a.desc}</span>
                    </button>
                  );
                })}
              </div>
              {assetType && (
                <p className="text-xs leading-relaxed text-faint">
                  ✦ 已启用资产生成规则：主光源、物理规则、亮暗区、材质真实
                </p>
              )}
            </div>

            {/* 风格预设 */}
            <StyleSelector value={styleId} onChange={setStyleId} />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-dim">目标平台</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const active = platforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                        active
                          ? "border-accent/60 bg-accent/10 text-accent-soft"
                          : "border-border bg-background-soft text-dim hover:border-faint"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          active ? "bg-accent" : "bg-faint"
                        }`}
                      />
                      {p.name}
                      <span className="text-xs text-faint">{p.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 高级设置（补充要求 + 常用预设） */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background-soft/50 p-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center justify-between text-sm font-medium text-dim transition-colors hover:text-foreground"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block transition-transform ${
                      showAdvanced ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                  高级设置
                  {extraNotes && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent-soft">
                      已填
                    </span>
                  )}
                </span>
                <span className="text-xs text-faint">补充要求 · 可选</span>
              </button>

              {showAdvanced && (
                <div className="flex flex-col gap-2.5">
                  {/* 常用预设标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    {EXTRA_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => applyExtraPreset(preset)}
                        className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-dim transition-colors hover:border-accent/50 hover:text-accent-soft"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-faint">画面文字/色调/镜头/不想要的东西</span>
                    <button
                      type="button"
                      onClick={importFrameOutput}
                      disabled={!frameOutput?.text}
                      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        frameImported
                          ? "border-accent/60 bg-accent/15 text-accent-soft"
                          : frameOutput?.text
                            ? "border-accent/40 bg-accent/5 text-accent-soft hover:bg-accent/15"
                            : "border-border bg-background-soft text-faint"
                      }`}
                      title="从坐标页导入 L/T/W/H 构图坐标"
                    >
                      {frameImported ? <>✓ 已导入坐标</> : <>⧉ 导入坐标</>}
                    </button>
                  </div>
                  <textarea
                    id="extraNotes"
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    placeholder="画面中的文字、色调、镜头、不想要的东西……"
                    rows={extraNotes.includes("\n") ? 4 : 2}
                    className="w-full resize-y rounded-lg border border-border bg-background-soft px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-faint focus:border-accent/50"
                  />
                  {frameOutput?.text && !extraNotes.includes("画面构图坐标") && (
                    <p className="text-xs leading-relaxed text-faint">
                      <span className="mr-1 text-accent/70">✦</span>
                      坐标页有{" "}
                      {frameOutput.text.split("\n").filter(Boolean).length}{" "}
                      个坐标框（{frameOutput.ratio}），点击「导入坐标」填入
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-6 py-3 text-base font-semibold text-background transition-all hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              )}
              {loading ? (
                <>
                  <Spinner />
                  正在打磨提示词…
                </>
              ) : (
                <>
                  <span className="text-lg leading-none">✦</span>
                  生成提示词
                  <kbd className="ml-1 hidden rounded border border-background/25 px-1.5 py-0.5 text-[10px] font-normal opacity-70 sm:inline">
                    Ctrl+↵
                  </kbd>
                </>
              )}
            </button>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            {/* 实时提示词预览（参数结构摘要） */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-border/50 bg-background-soft/40 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-faint">
                  提示词预览
                </span>
                <span className="text-[10px] text-faint">按六段式生成</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs leading-relaxed text-dim">
                <span className="text-faint">描述</span>
                <span className="max-w-[180px] truncate text-foreground/80">
                  {description.trim() || "（未填写）"}
                </span>
                <span className="text-faint">·</span>
                <span className="text-faint">风格</span>
                <span className="text-accent-soft">
                  {styleId
                    ? STYLES.find((s) => s.id === styleId)?.name ?? "自由创作"
                    : "自由创作"}
                </span>
                <span className="text-faint">·</span>
                <span className="text-faint">平台</span>
                <span className="text-foreground/80">
                  {platforms
                    .map((p) => (p === "gpt-image-2" ? "GPT-2" : "Nano"))
                    .join(" + ")}
                </span>
              </div>
            </div>
          </section>

          {/* 右栏 · 结果区 */}
          <section className="flex min-w-0 flex-1 flex-col gap-5">
            {/* Tab 切换 */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface/60 p-1">
              {(
                [
                  { key: "result", label: "生成结果" },
                  { key: "inspire", label: "灵感示例" },
                  { key: "history", label: "最近生成" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRightTab(tab.key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                    rightTab === tab.key
                      ? "bg-accent/15 text-accent-soft"
                      : "text-dim hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  {tab.key === "result" && results.length > 0 && (
                    <span className="ml-1 text-xs text-faint">
                      {results.length}
                    </span>
                  )}
                  {tab.key === "history" && history.length > 0 && (
                    <span className="ml-1 text-xs text-faint">
                      {history.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 生成结果 */}
            {rightTab === "result" && (
              <div ref={resultsRef} className="flex scroll-mt-6 flex-col gap-4">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-20 text-center">
                    <span className="text-4xl">🎬</span>
                    <p className="text-sm leading-relaxed text-dim">
                      在左侧描述你想生成的画面，选择风格后点击「生成提示词」
                      <br />
                      结果会出现在这里，中英双语、一键复制
                    </p>
                  </div>
                ) : (
                  results.map((r) => (
                    <PromptResultCard key={r.platform} result={r} />
                  ))
                )}
              </div>
            )}

            {/* 灵感示例 */}
            {rightTab === "inspire" && (
              <div className="flex flex-col gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setDescription(ex)}
                    className="group rounded-xl border border-border/60 bg-surface/50 px-4 py-3 text-left text-sm leading-relaxed text-dim transition-colors hover:border-accent/40 hover:text-foreground"
                  >
                    <span className="mr-2 text-accent/70 transition-colors group-hover:text-accent">
                      ✦
                    </span>
                    {ex}
                  </button>
                ))}
                <div className="mt-2">
                  <TemplateLibrary
                    onApply={(text, category) => {
                      setDescription(text);
                      if (category === "character") setAssetType("character");
                      else if (category === "scene") setAssetType("scene");
                      else if (category === "prop") setAssetType("prop");
                    }}
                  />
                </div>
              </div>
            )}

            {/* 历史记录 */}
            {rightTab === "history" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.25em] text-faint">
                    最近生成
                  </span>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistory([]);
                        localStorage.removeItem(HISTORY_KEY);
                      }}
                      className="text-xs text-faint transition-colors hover:text-danger"
                    >
                      清空历史
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-10 text-center text-sm text-faint">
                    暂无历史记录
                  </p>
                ) : (
                  history.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        setDescription(h.description);
                        setPlatforms(h.platforms);
                        if (h.assetType) setAssetType(h.assetType);
                        if (h.styleId) setStyleId(h.styleId);
                        setRightTab("result");
                        resultsRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="rounded-xl border border-border/60 bg-surface/50 px-4 py-3 text-left text-sm leading-relaxed text-dim transition-colors hover:border-accent/40 hover:text-foreground"
                    >
                      <span className="mr-2 text-xs text-faint">↻</span>
                      {h.description.slice(0, 80)}
                      {h.description.length > 80 ? "…" : ""}
                    </button>
                  ))
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="pt-4 text-center text-xs text-faint">
          廿七 · 第二十七夜，让想象成像 — 提示词由 LLM 生成，出图请在你的
          GPT-Image-2 / Nano Banana 中进行
        </footer>
      </div>
    </div>
  );
}

function Stars() {
  const stars = useMemoStars();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function useMemoStars() {
  const [stars] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      x: (i * 37 + 13) % 100,
      y: (i * 61 + 7) % 100,
      size: 1 + ((i * 7) % 3),
      delay: (i % 10) * 0.4,
      dur: 3 + ((i * 13) % 5),
    })),
  );
  return stars;
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background" />
  );
}
