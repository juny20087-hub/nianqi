"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "生图工坊",
    desc: "提示词生成",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    href: "/frame",
    label: "坐标生成",
    desc: "镜头框选",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </svg>
    ),
  },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border bg-background-soft/90 backdrop-blur sm:w-56">
      {/* 品牌 */}
      <Link
        href="/"
        className="flex items-center justify-center gap-0 border-b border-border px-2 py-5 sm:justify-start sm:gap-3 sm:px-5"
      >
        <span className="font-serif-sc text-2xl font-bold tracking-widest text-accent-soft">
          廿七
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-xs text-dim">Prompt Atelier</span>
          <span className="text-[10px] text-faint">第二十七夜</span>
        </span>
      </Link>

      {/* 导航项 */}
      <nav className="flex flex-1 flex-col gap-1.5 px-2 pt-4 sm:px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-center gap-3 rounded-xl border px-2 py-3 transition-colors sm:justify-start sm:px-3.5 ${
                active
                  ? "border-accent/50 bg-accent/10 text-accent-soft"
                  : "border-transparent text-dim hover:border-border hover:bg-surface hover:text-foreground"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[11px] text-faint">{item.desc}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 底部 */}
      <div className="hidden border-t border-border px-5 py-4 sm:block">
        <p className="text-[11px] leading-relaxed text-faint">
          廿七 · 让想象成像
          <br />
          GPT-Image-2 / Nano Banana
        </p>
      </div>
    </aside>
  );
}
