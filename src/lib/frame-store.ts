/**
 * 跨页面共享数据层 —— 坐标页 → 生图页 联动
 *
 * 坐标页（/frame）每次输出变化时保存到 localStorage，
 * 生图页（/）从 localStorage 读取并一键填入补充要求。
 *
 * 机制：
 * - localStorage 持久化（跨页面、跨刷新）
 * - 自定义事件 "nianqi:frame-output" 用于同页面内实时同步
 * - storage 事件用于跨标签页同步（可选）
 */

export const FRAME_OUTPUT_KEY = "nianqi-frame-output";
export const FRAME_OUTPUT_EVENT = "nianqi:frame-output";

export interface FrameOutput {
  /** 坐标文本（多行，每行一个 [L=.., T=.., W=.., H=..]） */
  text: string;
  /** 画布比例，如 "16:9" */
  ratio: string;
  /** 输出格式：percent | pixel */
  mode: string;
  /** 画布尺寸 */
  canvasWidth: number;
  canvasHeight: number;
  /** 更新时间戳 */
  updatedAt: number;
}

/** 保存坐标输出（坐标页调用） */
export function saveFrameOutput(output: Omit<FrameOutput, "updatedAt">): void {
  const full: FrameOutput = { ...output, updatedAt: Date.now() };
  try {
    localStorage.setItem(FRAME_OUTPUT_KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent(FRAME_OUTPUT_EVENT, { detail: full }));
  } catch {
    /* localStorage 不可用时忽略 */
  }
}

/** 读取坐标输出（生图页调用），无数据返回 null */
export function getFrameOutput(): FrameOutput | null {
  try {
    const raw = localStorage.getItem(FRAME_OUTPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FrameOutput;
    if (!parsed.text) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 清除坐标输出 */
export function clearFrameOutput(): void {
  try {
    localStorage.removeItem(FRAME_OUTPUT_KEY);
  } catch {
    /* ignore */
  }
}

/** 格式化坐标文本（供显示用） */
export function formatFrameOutputSummary(output: FrameOutput): string {
  const lines = output.text.split("\n").filter(Boolean);
  if (lines.length === 0) return "";
  return lines.length === 1
    ? lines[0]
    : `${lines[0]} 等 ${lines.length} 个坐标框`;
}
