/**
 * 使用 GitHub Contents API 上传代码（无需 git 协议，纯 HTTP + 代理）
 *
 * 用法：node upload.mjs
 * 环境变量：
 *   GITHUB_TOKEN  —— GitHub Personal Access Token（必需）
 *   GITHUB_USER   —— GitHub 用户名（默认 juny20087-hub）
 *   GITHUB_REPO   —— 仓库名（默认 nianqi）
 *   HTTPS_PROXY   —— 代理地址（默认 http://127.0.0.1:7897）
 */

import fs from "node:fs";
import path from "node:path";
import { HttpsProxyAgent } from "https-proxy-agent";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = __dirname;

const GITHUB_USER = process.env.GITHUB_USER || "juny20087-hub";
const GITHUB_REPO = process.env.GITHUB_REPO || "nianqi";
const TOKEN = process.env.GITHUB_TOKEN;
const PROXY =
  process.env.HTTPS_PROXY || "http://127.0.0.1:7897";

if (!TOKEN) {
  console.error("错误：未设置 GITHUB_TOKEN");
  process.exit(1);
}

const agent = new HttpsProxyAgent(PROXY);
const https = await import("node:https");

const API = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

function apiRequest(url, method, bodyObj) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method,
        agent,
        headers: {
          "User-Agent": "nianqi-uploader",
          Authorization: `token ${TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      },
    );
    req.on("error", reject);
    if (bodyObj) req.write(JSON.stringify(bodyObj));
    req.end();
  });
}

// 上传单个文件（自动处理目录），带重试
async function uploadFile(relPath, content, retries = 3) {
  const parts = relPath.split("/");
  const filename = parts.pop();
  const apiUrl = `${API}/${parts.length ? parts.join("/") + "/" : ""}${encodeURIComponent(filename)}`;

  const body = {
    message: `上传 ${relPath}`,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: "main",
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await apiRequest(apiUrl, "PUT", body);
      if (res.status === 201 || res.status === 200) {
        console.log(`  ✓ ${relPath}`);
        return true;
      } else if (res.status === 422) {
        console.log(`  ! ${relPath} 已存在或无效，跳过`);
        return "skip";
      } else if (res.status === 409) {
        // 并发冲突，重试
        if (attempt < retries) {
          console.log(`  ~ ${relPath} 冲突，重试 ${attempt}/${retries}`);
          await sleep(1000 * attempt);
          continue;
        }
        console.log(`  ✗ ${relPath} 冲突 (${res.status})`);
        return "conflict";
      } else {
        console.log(`  ✗ ${relPath} 失败 (${res.status}): ${JSON.stringify(res.body).slice(0, 200)}`);
        return false;
      }
    } catch (err) {
      if (attempt < retries) {
        console.log(`  ~ ${relPath} 网络错误(${err.message})，重试 ${attempt}/${retries}`);
        await sleep(1500 * attempt);
        continue;
      }
      console.log(`  ✗ ${relPath} 网络失败: ${err.message}`);
      return false;
    }
  }
  return false;
}

// 递归收集要上传的文件（忽略敏感和依赖目录）
function collectFiles(root, base = "") {
  const results = [];
  for (const entry of fs.readdirSync(path.join(root, base), { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") continue;
    // 排除敏感文件：.env.local、.env 等（含 API Key）
    if (entry.name.startsWith(".env")) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(root, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

async function main() {
  console.log(`→ 上传到 ${GITHUB_USER}/${GITHUB_REPO} (main)`);
  console.log(`→ 代理: ${PROXY}`);
  console.log("");

  const files = collectFiles(dir);
  console.log(`共 ${files.length} 个文件：`);
  console.log("");

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), "utf8");
    const result = await uploadFile(f, content);
    if (result === true) ok++;
    else if (result === "skip") skip++;
    else if (result === "conflict") skip++;
    else fail++;
    await sleep(250); // 避免 API 限流
  }

  console.log("");
  console.log("==== 上传完成 ====");
  console.log(`上传: ${ok} | 跳过(已存在): ${skip} | 失败: ${fail}`);
  console.log("");
  console.log("下一步：打开 https://zeabur.com 用 Google 账号登录，");
  console.log("新建项目 → 从 GitHub 导入 → 部署");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error("失败:", e.message);
  process.exit(1);
});
