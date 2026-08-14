import { NextResponse } from "next/server";
import {
  generatePrompts,
  type AssetType,
  type GenerateParams,
  type TargetPlatform,
} from "@/lib/prompt-engine";
import { STYLES } from "@/lib/styles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PLATFORMS: TargetPlatform[] = ["gpt-image-2", "nano-banana"];
const VALID_ASSET_TYPES: Exclude<AssetType, undefined>[] = [
  "character",
  "scene",
  "prop",
];
const VALID_STYLE_IDS = new Set(STYLES.map((s) => s.id));

interface GenerateRequest {
  description?: string;
  platforms?: TargetPlatform[];
  extraNotes?: string;
  assetType?: AssetType;
  styleId?: string;
}

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description) {
    return NextResponse.json({ error: "请先描述你想生成的画面" }, { status: 400 });
  }
  if (description.length > 2000) {
    return NextResponse.json(
      { error: "描述太长了，请控制在 2000 字以内" },
      { status: 400 },
    );
  }

  let platforms = body.platforms ?? [];
  if (platforms.length === 0) {
    platforms = [...VALID_PLATFORMS];
  }
  platforms = [...new Set(platforms)].filter((p) =>
    VALID_PLATFORMS.includes(p),
  );
  if (platforms.length === 0) {
    return NextResponse.json(
      { error: "目标平台不合法" },
      { status: 400 },
    );
  }

  let assetType: AssetType;
  if (body.assetType === undefined) {
    assetType = undefined;
  } else if (VALID_ASSET_TYPES.includes(body.assetType as never)) {
    assetType = body.assetType as Exclude<AssetType, undefined>;
  } else {
    return NextResponse.json(
      { error: "资产类型不合法，可选 character / scene / prop" },
      { status: 400 },
    );
  }

  let styleId: string | undefined;
  if (body.styleId !== undefined) {
    if (body.styleId === "none" || VALID_STYLE_IDS.has(body.styleId)) {
      styleId = body.styleId === "none" ? undefined : body.styleId;
    } else {
      return NextResponse.json(
        { error: "风格不合法，请选择有效的风格预设" },
        { status: 400 },
      );
    }
  }

  const params: GenerateParams = {
    description,
    platforms,
    extraNotes: body.extraNotes?.trim() || undefined,
    assetType,
    styleId,
  };

  try {
    const results = await generatePrompts(params, platforms);
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json(
      { error: `提示词生成失败：${message}` },
      { status: 500 },
    );
  }
}
