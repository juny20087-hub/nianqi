import type { Metadata } from "next";
import FrameCanvas from "@/components/FrameCanvas";

export const metadata: Metadata = {
  title: "廿七 · 坐标生成",
  description: "RectCanvas 坐标画框生成器 —— 拖拽绘制 L/T/W/H 坐标框",
};

export default function FramePage() {
  return <FrameCanvas />;
}
