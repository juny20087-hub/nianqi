/**
 * 提示词生成引擎
 *
 * 输入：用户的中文画面描述 + 目标平台
 * 输出：针对 GPT-Image-2 / Nano Banana 分别优化的提示词（中英双语）
 *
 * 设计依据（研究摘要）：
 * - GPT-Image-2（OpenAI ChatGPT）＝「图纸」：重结构与版式规格，
 *   文字必须加引号、写清字体/位置/层级，用自然语言段落而非标签堆砌。
 * - Nano Banana（Google Gemini）＝「工单」：重细节描述与编辑指令，
 *   风格词靠前、光线必写，信息越具体效果越好。
 */

import { chatCompletion, type ChatMessage } from "./llm";
import { getStyleById } from "./styles";

export type TargetPlatform = "gpt-image-2" | "nano-banana";

export interface PromptResult {
  zh: string;
  en: string;
}

export interface GenerateOutput {
  /** 目标平台 */
  platform: TargetPlatform;
  /** 优化后的提示词 */
  prompt: PromptResult;
  /** 简短说明：这样优化是为什么 */
  rationale: string;
}

export interface GenerateParams {
  /** 用户的中文描述 */
  description: string;
  /** 目标平台列表 */
  platforms: TargetPlatform[];
  /** 可选：用户补充要求（负面约束、风格指定等） */
  extraNotes?: string;
  /** 可选：资产类型（资产生成模式），默认 undefined 为通用生图 */
  assetType?: AssetType;
  /** 可选：风格预设 id（styles.ts），默认 undefined 为自由创作 */
  styleId?: string;
}

export type AssetType = "character" | "scene" | "prop" | undefined;

/** 电影感硬规则（研究自多种电影提示词指南，注入所有提示词） */
const CINEMATIC_RULES = `
## 电影感硬规则（所有输出默认执行，除非用户明确要求非电影风格）
1. 景别必选：必须从 [大远景/远景/中景/近景/特写/大特写/过肩/航拍] 中指定一个景别；禁止默认广角全景
2. 机位与运动：情绪需要时指定 [低角度/高角度/荷兰角/平视]；运动感用结果词暗示（motion blur on background, streaking lights, wind-blown），不要写"镜头在推"
3. 单一主光源：只描述 1 个主光源及其方向（如 window light from the left）；禁止 well-lit / brightly lit / evenly lit
4. 指明光质：光源必须是 [硬光/柔光/逆光轮廓光/侧光/顶光/实用光/动机光] 之一；优先使用 practical light（画面内可见光源）
5. 低光调优先：默认倾向 low-key、high contrast、deep shadows、chiaroscuro；仅当用户明确要明亮场景才写 high-key
6. 氛围时段必选：从 [黄金时刻/蓝调时刻/深夜霓虹/阴天/雾/雨/雪] 中指定时间与天气各一
7. 色彩收敛：全图只允许 1 个主色调；风格化时用经典配方（teal-orange、bleach bypass、Kodak Portra、Cinestill 800T、高对比黑白）；禁止堆叠 vibrant/colorful/saturated
8. 胶片质感必加：默认添加 film grain（强度随题材：纪实重、商业轻），可加 halation、vignette、bloom；人物特写必加 skin texture（pores、imperfections）防塑料感
9. 镜头参数必给：每图给出 1 个焦距（24/35/50/85/135mm）与景深（shallow / deep）；电影感默认浅景深，史诗场面可用 deep focus
10. 构图显式化：用三分法或对称之一；画面必须有前/中/后三层（写 "layers: foreground/midground/background"）；可用引导线、框架、负空间、空气透视增强纵深
11. 情绪收尾限 1-2 词：情绪词只允许 1-2 个放句尾（melancholic、tense、serene、eerie、nostalgic…），禁止堆砌
12. 规格与负面收尾：结尾固定 "2.39:1 (或 16:9) anamorphic frame, no text, no watermark, no logo, no CGI look"
13. 删除空洞形容词：masterpiece、ultra-realistic、8K、hyper-detailed、stunning 一律删除——它们不产生电影感，具体参数才产生
14. 风格锚点可用但不可替代：可引用导演/摄影师风格（Wes Anderson、Nolan、王家卫、Roger Deakins、Lubezki）作为风格锚点，但必须与上述参数共存
`;

/** 两个平台共通的提示词最佳实践 */
const COMMON_RULES = `
## 通用规则（两个平台都必须遵守）
1. 主体明确：谁/什么 + 正在做什么 + 处于什么场景；具体名词配具体形容词（"哑光黑陶瓷杯"优于"一个杯子"）
2. 场景与环境：地点、氛围、时代背景要写清楚
3. 构图给数字：景别（特写/近景/中景/远景）、机位（平视/俯视/仰视）、留白比例、三分法位置
4. 光线必写，且必须包含以下全部要素：
   - 主光源（Key Light）：明确光源类型（窗户光/太阳/钨丝灯/霓虹/柔光箱等）、方向、色温、强度
   - 辅助光（Fill Light）与轮廓光（Rim Light）：如有，说明作用与强度
   - 阴影逻辑：光源位置决定阴影方向，软阴影或硬阴影要明确
5. 色彩方案：主色调、冷暖倾向、饱和度
6. 材质与细节：表面质感（皮肤/金属/玻璃/织物/水/毛发）
7. 风格词统一：photorealistic / cinematic / minimal / watercolor / 3D render 等
8. 负面约束用正面描述："纯白背景、无其他物体"而不是"不要背景杂物"
9. 如果画面中出现文字：用引号包住确切文字内容，拼写必须准确
10. 输出风格：写连贯的自然语言段落，一句一个要素，不要用逗号分隔的关键词堆砌

## 物理真实感硬规则（所有输出必须遵守）
1. 场景中必须确定唯一主光源：说清"主光从哪个方向来、什么类型、什么色温"，并让阴影方向与主光源方向一致
2. 一切光影必须符合自然物理规则：光随距离衰减、遮挡产生投影、反射角度合理、玻璃/水面有折射与高光
3. 画面必须有亮区也有暗区：避免均匀平光；通过明暗对比建立体积感与层次感，暗部要有细节（不纯黑死黑）
4. 材质必须参考真实物品：金属有反射与高光、皮肤有次表面散射感、布料有纤维纹理、石头有颗粒与风化；
   材质要"落在地上"，有重量感与触感，禁止悬浮感与廉价塑料感
5. 环境光与主光协调：环境光（Ambient）定基调，主光定方向，二者色温关系合理（如冷环境+暖主光）
`;

/** 资产生成模式规则 —— 人物资产 */
const CHARACTER_ASSET_RULES = `
## 人物资产模式规则
- 定位：游戏/影视/3D 可复用的人物资产，强调一致性、可辨识度与多角度可读性
- 主体：明确人物身份、年龄、性别、体型、服装（材质+颜色+剪裁）、配饰、表情与姿态
- 视角：默认正面 3/4 视角，注明"全身/半身/头像特写"；如需三视图请明确说明
- 光线：使用可控的棚拍式布光（如"主光 45° 高位 + 柔和辅助光 + 轮廓光"），
  避免过于戏剧化的环境光，保证人物面部与服装细节清晰
- 材质：皮肤质感、头发（发丝/光泽）、服装面料（皮革/棉麻/铠甲金属）逐一说明
- 一致性锚点：给出可重复的特征描述（发型、瞳色、伤疤、纹身等），便于后续跨图一致
`;

/** 资产生成模式规则 —— 场景资产 */
const SCENE_ASSET_RULES = `
## 场景资产模式规则
- 定位：游戏/影视/3D 可复用的环境场景，强调空间结构、景深层次与氛围一致性
- 空间：明确空间类型（室内/室外/废墟/森林/城市一角）、规模（一角/房间/开阔地形）、时代与风格
- 布局：前景/中景/背景三层结构明确，视觉引导线（路径/光线/透视）清晰
- 光线：必须确定主光源（太阳/月光/天光/人造灯），说清方向与色温；
  场景要有明确的明暗分区（亮部区域+阴影区域+过渡区）
- 氛围：空气透视（远处偏蓝发虚）、雾气/尘粒/体积光等氛围元素可强化空间感
- 可读性：关键结构（门窗/台阶/标志物）清晰可辨，避免杂乱无章的细节堆砌
`;

/** 资产生成模式规则 —— 道具资产 */
const PROP_ASSET_RULES = `
## 道具资产模式规则
- 定位：游戏/影视/3D 可复用的独立道具，强调单体清晰度与材质真实感
- 主体：单一道具，明确用途、年代、风格、磨损程度（全新/做旧/战损）
- 视角：默认 3/4 视角展示主体全貌，如需多角度请说明
- 光线：棚拍式打光（主光 + 辅助光 + 轮廓光），让道具的每个面都有合理的明暗
- 材质：金属/木材/皮革/玻璃/塑料等材质必须有真实的反射、粗糙度与细节
- 背景：默认中性纯色背景（灰/黑/白）突出道具，如需环境展示另说明
`;

/** GPT-Image-2 专属规则 —— 「图纸」心智 */
const GPT_IMAGE_2_RULES = `
## GPT-Image-2 专属规则（你的角色：给设计总监看的图纸）
- 这是 OpenAI ChatGPT 内置的图像模型，理解自然语言极强，尤其擅长写实摄影、艺术插画、海报与版面设计
- 文字渲染是它的王牌：画面中的文字必须用引号给出确切字符串，并写清字体风格、位置、颜色、大小层级
- 有排版需求时：写明对齐方式、边距、留白比例、字号层级
- 用「六段式」结构组织：主体 → 场景 → 构图 → 光线 → 材质与色彩 → 风格与文字
- 指定画幅比例（1:1 / 16:9 / 3:4）
- 写实类画面补充镜头参数（如 85mm 镜头、f/1.8、浅景深）非常有效
`;

/** Nano Banana 专属规则 —— 「工单」心智 */
const NANO_BANANA_RULES = `
## Nano Banana 专属规则（你的角色：给修图师下工单）
- 这是 Google Gemini 的图像模型，对详细长文本描述的理解力极强，信息越具体细节越丰富
- 官方强调：构图、光线、材质细节、文字规则写清楚会显著提升效果
- 风格词放靠前，光线描述必写
- 一个核心目标 + 最多 3 个辅助要求，避免冲突约束
- 如果用户的描述是"修改/改进某张已有图片"：第一句先声明"保持原图结构不变，只改 Y"，一次只改一个点
- 文字能力弱于 GPT-Image-2：画面中的文字控制在短标题级别，同样用引号给出确切内容
- 指定画幅比例（1:1 / 16:9 / 3:4）
`;

/** 构建系统提示词 */
function buildSystemPrompt(
  platform: TargetPlatform,
  assetType?: AssetType,
  styleId?: string,
): string {
  const platformRules =
    platform === "gpt-image-2" ? GPT_IMAGE_2_RULES : NANO_BANANA_RULES;

  const assetRules =
    assetType === "character"
      ? CHARACTER_ASSET_RULES
      : assetType === "scene"
        ? SCENE_ASSET_RULES
        : assetType === "prop"
          ? PROP_ASSET_RULES
          : "";

  const style = getStyleById(styleId);
  const styleRules = style.rules
    ? `## 用户选择的风格：${style.name}\n${style.rules}\n${style.avoid ? `\n排除要求：${style.avoid}` : ""}`
    : "";

  return `你是一名顶级的 AI 图像生成提示词工程师，专门为 AI 生图模型撰写高质量提示词。

用户会给你一段中文画面描述，你要把它优化成一段专业、具体、可直接用于 AI 生图的提示词。

${COMMON_RULES}
${CINEMATIC_RULES}
${platformRules}
${assetRules}
${styleRules}

## 输出要求
- 同时输出中文和英文两个版本的提示词，两版内容必须等价
- 中文版：用流畅的中文自然语言描述画面，保留关键专业术语
- 英文版：用英文自然语言描述，专业、地道，适合直接粘贴进 AI 生图工具
- 英文版建议 60-150 词，信息密度高但必须是连贯句子
- 如果用户的描述包含矛盾或模糊之处，选择最合理的解读并在 rationale 里说明
- 用户选择风格时，提示词必须贴合该风格规则；自由创作时遵循通用与电影感规则
- 用 JSON 格式输出，字段：
  {
    "prompt": { "zh": "中文提示词", "en": "英文提示词" },
    "rationale": "一句话说明优化思路（中文）"
  }`;
}

/** 构建用户消息 */
function buildUserMessage(params: GenerateParams): string {
  let msg = `画面描述：${params.description}`;
  if (params.extraNotes?.trim()) {
    msg += `\n\n补充要求：${params.extraNotes.trim()}`;
  }
  return msg;
}

/** 解析 LLM 返回的 JSON */
function parseJsonOutput<T>(raw: string): T {
  const text = raw.trim();
  // 去掉可能的 ```json 代码块包裹
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 尝试提取第一个 { ... } 块
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("LLM 返回的不是有效 JSON");
  }
}

/** 为单个平台生成提示词 */
export async function generateForPlatform(
  params: GenerateParams,
  platform: TargetPlatform,
): Promise<GenerateOutput> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt(platform, params.assetType, params.styleId),
    },
    { role: "user", content: buildUserMessage(params) },
  ];

  const raw = await chatCompletion(messages, {
    temperature: 0.75,
    maxTokens: 2048,
  });

  const parsed = parseJsonOutput<{
    prompt?: { zh?: string; en?: string };
    rationale?: string;
  }>(raw);

  const zh = parsed.prompt?.zh?.trim();
  const en = parsed.prompt?.en?.trim();
  if (!zh || !en) {
    throw new Error("LLM 返回缺少提示词内容");
  }

  return {
    platform,
    prompt: { zh, en },
    rationale: parsed.rationale?.trim() ?? "",
  };
}

/** 为多个平台生成提示词（并行） */
export async function generatePrompts(
  params: GenerateParams,
  platforms: TargetPlatform[],
): Promise<GenerateOutput[]> {
  const results = await Promise.all(
    platforms.map((p) => generateForPlatform(params, p)),
  );
  return results;
}
