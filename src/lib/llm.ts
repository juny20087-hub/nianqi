/**
 * LLM 适配层
 *
 * 支持任意 OpenAI Chat Completions 兼容接口：
 * - DeepSeek:      https://api.deepseek.com
 * - SiliconFlow:   https://api.siliconflow.cn/v1
 * - 自定义接口:     通过环境变量覆盖 BASE_URL
 *
 * 环境变量：
 * - LLM_API_KEY      必填，API Key
 * - LLM_BASE_URL     可选，默认 https://api.deepseek.com
 * - LLM_MODEL        可选，默认 deepseek-chat
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** 是否输出 JSON（加 json_object 约束，部分服务商支持） */
  jsonMode?: boolean;
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";

export function getLlmConfig() {
  return {
    apiKey: process.env.LLM_API_KEY ?? "",
    baseUrl: (process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    model: process.env.LLM_MODEL ?? DEFAULT_MODEL,
  };
}

/** 单次 chat completion 调用，返回 assistant 文本 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const { apiKey, baseUrl, model } = getLlmConfig();

  if (!apiKey) {
    throw new Error("未配置 LLM_API_KEY，请在 .env.local 中设置");
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 4096,
    stream: false,
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM 调用失败 (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM 返回内容为空");
  }
  return content;
}
