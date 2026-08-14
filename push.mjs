/**
 * 使用 isomorphic-git 推送代码到 GitHub（无需安装原生 Git）
 *
 * 用法：node push.mjs
 * 需要环境变量：
 *   GITHUB_TOKEN  —— GitHub Personal Access Token（必需）
 *   GITHUB_USER   —— GitHub 用户名（默认 juny20087-hub）
 *   GITHUB_REPO   —— 仓库名（默认 nianqi）
 *   HTTPS_PROXY   —— 可选，代理地址（默认 http://127.0.0.1:7897 系统 Clash 代理）
 */

import fs from "node:fs";
import path from "node:path";
import * as git from "isomorphic-git";
import { HttpsProxyAgent } from "https-proxy-agent";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;

const GITHUB_USER = process.env.GITHUB_USER || "juny20087-hub";
const GITHUB_REPO = process.env.GITHUB_REPO || "nianqi";
const TOKEN = process.env.GITHUB_TOKEN;
const PROXY =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  "http://127.0.0.1:7897";

if (!TOKEN) {
  console.error("错误：未设置 GITHUB_TOKEN 环境变量");
  process.exit(1);
}

const url = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;

// 通过系统代理访问 GitHub
const agent = new HttpsProxyAgent(PROXY);

const httpPlugin = {
  async request({ url: u, method, headers, body }) {
    const parsed = new URL(u);
    const https = await import("node:https");
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          method,
          headers: { ...headers, "User-Agent": "isomorphic-git-nianqi" },
          agent,
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({
              url: u,
              method,
              headers: res.headers,
              body: Buffer.concat(chunks),
              statusCode: res.statusCode,
            }),
          );
        },
      );
      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  },
};

async function main() {
  console.log(`→ 目标仓库: ${url}`);
  console.log(`→ 用户: ${GITHUB_USER}`);
  console.log(`→ 代理: ${PROXY}`);

  // 1. 初始化仓库
  try {
    await git.init({ fs, dir, defaultBranch: "main" });
    console.log("✓ 已初始化 git 仓库 (main)");
  } catch (e) {
    console.log("仓库可能已初始化，继续…");
  }

  // 2. 配置用户
  await git.setConfig({ fs, dir, path: "user.name", value: GITHUB_USER });
  await git.setConfig({
    fs,
    dir,
    path: "user.email",
    value: `${GITHUB_USER}@users.noreply.github.com`,
  });

  // 3. 暂存所有文件
  console.log("→ 暂存文件…");
  const allFiles = await walkDir(dir);
  for (const f of allFiles) {
    await git.add({ fs, dir, filepath: f }).catch(() => {});
  }

  // 4. 提交
  try {
    await git.commit({
      fs,
      dir,
      message: "廿七 · 提示词工坊 v2（电影感规则 + 风格系统 + 双栏布局）",
      author: {
        name: GITHUB_USER,
        email: `${GITHUB_USER}@users.noreply.github.com`,
      },
    });
    console.log("✓ 已提交");
  } catch (e) {
    console.log("提交跳过（可能无变更）: " + e.message);
  }

  // 5. 推送
  console.log("→ 推送到 GitHub…");
  await git.push({
    fs,
    dir,
    remote: "origin",
    url,
    ref: "main",
    onAuth: () => ({
      username: GITHUB_USER,
      password: TOKEN,
    }),
    http: httpPlugin,
  });
  console.log("✓ 推送成功！");
  console.log("");
  console.log("下一步：打开 https://zeabur.com 用 Google 账号登录，");
  console.log("新建项目 → 从 GitHub 导入 juny20087-hub/nianqi → 部署");
}

// 递归列出目录下所有文件（忽略 .git 和 node_modules）
function walkDir(root, base = "") {
  const results = [];
  for (const entry of fs.readdirSync(path.join(root, base), {
    withFileTypes: true,
  })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...walkDir(root, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

main().catch((e) => {
  console.error("推送失败:", e.message);
  process.exit(1);
});
