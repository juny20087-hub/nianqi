import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import "@/components/frame-canvas.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "廿七 · 提示词工坊",
  description:
    "廿七 —— 把你的画面描述，变成 GPT-Image-2 与 Nano Banana 都能读懂的专业提示词。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <NavBar />
        <main className="ml-16 min-h-full sm:ml-56">{children}</main>
      </body>
    </html>
  );
}
