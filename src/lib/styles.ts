/**
 * 风格预设系统
 *
 * 设计参考 Fooocus 的「样式 = 正片片段 + 负片/排除片段」模式：
 * 每个风格 = 名称 + 描述 + 一段规则（注入系统提示词） + 一段排除说明。
 * 用户选择一个风格，引擎按风格规则生成对应风格的提示词。
 */

export interface StylePreset {
  id: string;
  name: string;
  category: "cinematic" | "documentary" | "render" | "art" | "none";
  desc: string;
  /** 注入系统提示词的风格规则（英文为主，供 LLM 执行） */
  rules: string;
  /** 排除/避免的要素（转为"避免"说明，对话式模型用） */
  avoid: string;
  /** 示例描述（点击填入描述框） */
  example: string;
}

export const STYLES: StylePreset[] = [
  // ===== 电影类（6 套精选） =====
  {
    id: "blockbuster",
    name: "好莱坞大片",
    category: "cinematic",
    desc: "高戏剧性、青橙对比、宽银幕、史诗感",
    rules: `Style: Hollywood blockbuster. Cinematic wide or medium shot with dramatic composition. Lighting: single strong key light, high contrast, deep shadows, motivated light from a visible source. Camera: shot on 35mm or anamorphic lens, shallow depth of field, 2.39:1 anamorphic frame. Color: teal-and-orange grade, rich contrast, cinematic saturation. Texture: fine film grain, subtle halation, vignette. Scale: grand, epic, cinematic spectacle.`,
    avoid: `avoid flat even lighting, avoid washed-out colors, avoid TV-show look, avoid plastic CGI feel`,
    example:
      "一位穿红色斗篷的战士站在燃烧的城市废墟前，背后是巨大的爆炸火球，史诗级好莱坞大片场景，低角度仰拍，宽银幕构图",
  },
  {
    id: "wong-kar-wai",
    name: "王家卫式霓虹",
    category: "cinematic",
    desc: "霓虹夜色、运动模糊、烟雾、褪色暖调",
    rules: `Style: Wong Kar-wai romantic neon. Night city setting with neon signs, wet streets reflecting colored light. Lighting: practical neon light sources, strong colored rim light (red/green/blue), moody low-key. Camera: handheld feel, slight motion blur on background while subject stays sharp, 50mm lens, shallow depth of field. Color: faded warm tones with saturated neon accents, slight film grain, dreamy nostalgic mood. Composition: subject off-center, negative space, atmospheric smoke or rain.`,
    avoid: `avoid clean sterile look, avoid bright daylight, avoid sharp clinical focus everywhere`,
    example:
      "雨夜的香港街头，一个穿旗袍的女子撑着红伞回头凝望，霓虹灯牌在湿漉漉的地面上晕开光晕，王家卫式电影氛围",
  },
  {
    id: "nolan",
    name: "诺兰低照度",
    category: "cinematic",
    desc: "高对比、低饱和、IMAX 大画幅、实拍质感",
    rules: `Style: Christopher Nolan practical realism. IMAX-scale composition, monumental scale. Lighting: naturalistic motivated light, single source, deep shadows, high contrast, low-key. Camera: shot on IMAX film, deep focus with selective detail, wide establishing shots. Color: desaturated, muted palette, cold shadows with neutral highlights, minimal color grading intervention. Texture: authentic film grain, practical location feel, grounded realism. Mood: tense, serious, weighty.`,
    avoid: `avoid fantasy colors, avoid glossy commercial look, avoid over-stylized effects`,
    example:
      "一名宇航员独自站在巨大的白色沙丘上，背对镜头望向远处的黑色巨舰，诺兰式冷峻低照度，IMAX 大画幅，史诗级荒凉",
  },
  {
    id: "noir",
    name: "黑白 Noir",
    category: "cinematic",
    desc: "明暗对照、百叶窗光影、硬主光、湿街",
    rules: `Style: classic film noir. Black and white high-contrast photography. Lighting: chiaroscuro, hard key light with dramatic shadows, venetian blind shadow patterns, single practical lamp source, smoky atmosphere. Camera: 35mm film, deep shadows, expressive composition, low or Dutch angle. Texture: heavy film grain, period 1940s-50s feel. Mood: suspenseful, mysterious, dangerous.`,
    avoid: `avoid color (must be monochrome), avoid soft flat lighting, avoid modern digital clean look`,
    example:
      "雨夜的小巷里，一个戴礼帽的侦探站在路灯下点燃香烟，百叶窗的光影斜斜地打在他脸上，经典黑色电影 noir 风格",
  },
  {
    id: "cyberpunk",
    name: "赛博朋克夜戏",
    category: "cinematic",
    desc: "霓虹青紫、雨夜反光、体积光、未来都市",
    rules: `Style: cyberpunk night city. Futuristic metropolis at night, dense neon signage (cyan, magenta, purple), wet streets with mirror reflections. Lighting: practical neon lights as main sources, volumetric light through rain/fog, strong color contrast. Camera: wide or medium shot, 24mm or 35mm lens, shallow depth of field with bokeh from neon points. Color: neon cyan-magenta palette with deep blacks, high contrast. Texture: fine film grain, atmospheric haze. Mood: dystopian, electric, gritty.`,
    avoid: `avoid daylight, avoid desaturated dull colors, avoid clean futuristic utopia look`,
    example:
      "未来都市的雨夜立交桥下，一个穿发光雨衣的改造人骑摩托飞驰而过，霓虹灯牌与车灯拖出彩色光轨，赛博朋克夜戏",
  },
  {
    id: "documentary",
    name: "胶片纪实",
    category: "cinematic",
    desc: "自然光、粗颗粒、手持感、真实不修饰",
    rules: `Style: documentary film realism. Unstaged, authentic moment captured as if by a photojournalist. Lighting: available natural light only (window light, overcast, street light), no artificial setup. Camera: 16mm or 35mm documentary film, medium or close-up shot, slight handheld imperfection, natural depth of field. Color: natural muted tones, honest color, heavy fine film grain. Texture: real skin texture, environmental details, no retouching feel. Mood: genuine, human, candid.`,
    avoid: `avoid studio lighting, avoid perfect composition, avoid glamour retouching, avoid plastic skin`,
    example:
      "老旧的菜市场里，一位卖鱼的大叔蹲在摊位边用毛巾擦汗，晨光从塑料棚顶漏进来，纪实摄影质感，不加修饰的真实瞬间",
  },

  // ===== 3D 渲染 =====
  {
    id: "3d-render",
    name: "3D 渲染",
    category: "render",
    desc: "高多边形、PBR 材质、全局光照、游戏/影视预览",
    rules: `Style: high-quality 3D render (PBR). Detailed geometry with clean topology feel. Lighting: studio three-point setup or cinematic HDRI environment, global illumination, soft contact shadows. Camera: realistic lens simulation, shallow depth of field, 50mm or 85mm. Materials: physically-based rendering — metal with clear reflections, skin with subsurface scattering, fabric with fiber detail. Texture: crisp render output, subtle ambient occlusion. Suited for game or film asset presentation.`,
    avoid: `avoid clay-render look, avoid flat unlit materials, avoid 2D painted feel`,
    example:
      "一把机械风格手枪的 3D 渲染展示图，高多边形模型，PBR 材质，金属反射清晰，全局光照，暗色背景突出主体",
  },

  // ===== 艺术插画 =====
  {
    id: "illustration",
    name: "概念插画",
    category: "art",
    desc: "手绘笔触、艺术化、概念设计",
    rules: `Style: concept art illustration. Painterly strokes, artistic interpretation. Lighting: dramatic but stylized, painterly shadows and highlights. Camera: cinematic composition, expressive perspective. Color: curated artistic palette, either bold or muted per subject. Texture: visible brush strokes, canvas or paper feel, digital painting finish. Mood: evocative, imaginative, designed.`,
    avoid: `avoid photorealistic rendering, avoid raw unpolished sketch, avoid AI-smooth blur`,
    example:
      "天空之城的概念插画，巨大的浮空岛屿底部垂着藤蔓与瀑布，飞艇穿梭其间，油画笔触，梦幻的黄昏光线",
  },
];

/** 默认风格（不注入任何风格规则） */
export const DEFAULT_STYLE: StylePreset = {
  id: "none",
  name: "自由创作",
  category: "none",
  desc: "不限定风格，由描述自然决定",
  rules: "",
  avoid: "",
  example: "",
};

export function getStyleById(id: string | undefined): StylePreset {
  if (!id) return DEFAULT_STYLE;
  return STYLES.find((s) => s.id === id) ?? DEFAULT_STYLE;
}

export const STYLE_CATEGORY_META: Record<
  StylePreset["category"],
  { label: string }
> = {
  cinematic: { label: "电影风格" },
  documentary: { label: "纪实" },
  render: { label: "3D" },
  art: { label: "插画" },
  none: { label: "自由" },
};
