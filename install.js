#!/usr/bin/env node

/**
 * OpenClaw Telegram Proxy 插件安装脚本 (Node.js)
 *
 * 用法:
 *   node install.js                    # 交互式配置
 *   node install.js https://proxy.com # 命令行参数自动配置
 *   OPENCLAW_TELEGRAM_PROXY_URL=https://proxy.com node install.js  # 环境变量
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const PLUGIN_NAME = "openclaw-telegram-proxy";
const GITHUB_REPO = "https://github.com/hillghost86/openclaw-telegram-proxy.git";
const GITHUB_ZIP = "https://github.com/hillghost86/openclaw-telegram-proxy/archive/refs/heads/main.zip";

const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
};

function log(msg, color = (s) => s) {
  console.log(color(msg));
}

function resolveRealHome() {
  if (process.platform !== "win32" && process.env.SUDO_USER) {
    const home = path.join("/home", process.env.SUDO_USER);
    if (fs.existsSync(home)) return home;
    const macHome = path.join("/Users", process.env.SUDO_USER);
    if (fs.existsSync(macHome)) return macHome;
    return path.join(os.homedir(), "..", process.env.SUDO_USER);
  }
  return os.homedir();
}

function findSourcePathSync() {
  // 1. 脚本所在目录
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  if (
    fs.existsSync(path.join(scriptDir, "index.ts")) &&
    fs.existsSync(path.join(scriptDir, "openclaw.plugin.json"))
  ) {
    return scriptDir;
  }

  // 2. 当前目录
  const cwd = process.cwd();
  if (
    fs.existsSync(path.join(cwd, "index.ts")) &&
    fs.existsSync(path.join(cwd, "openclaw.plugin.json"))
  ) {
    return cwd;
  }

  // 3. NPM 全局
  try {
    const npmRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    const npmPath = path.join(npmRoot, PLUGIN_NAME);
    if (fs.existsSync(path.join(npmPath, "index.ts"))) {
      return npmPath;
    }
  } catch {
    // ignore
  }

  return null;
}

async function fetchFromGitHub() {
  const tmpDir = path.join(os.tmpdir(), `openclaw-telegram-proxy-${process.pid}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    execSync("git", ["clone", "--depth", "1", GITHUB_REPO, tmpDir], {
      stdio: "pipe",
    });
    log("✓ 下载完成", colors.green);
    return tmpDir;
  } catch {
    // try fetch + unzip
  }

  const zipPath = path.join(tmpDir, "main.zip");
  try {
    const res = await fetch(GITHUB_ZIP, { redirect: "follow" });
    const buf = await res.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(buf));

    const extractDir = path.join(tmpDir, "extract");
    fs.mkdirSync(extractDir, { recursive: true });

    if (process.platform === "win32") {
      const psScriptPath = path.join(tmpDir, "extract.ps1");
      fs.writeFileSync(
        psScriptPath,
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`,
        "utf8"
      );
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, {
        stdio: "pipe",
      });
    } else {
      execSync("unzip", ["-q", "-o", zipPath, "-d", extractDir], {
        stdio: "pipe",
      });
    }

    const extracted = path.join(extractDir, "openclaw-telegram-proxy-main");
    if (fs.existsSync(extracted)) {
      log("✓ 下载完成", colors.green);
      return extracted;
    }
  } catch {
    // ignore
  }

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return null;
}

function copyDir(src, dest, exclude = new Set(["node_modules", ".git"])) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const ent of entries) {
    if (exclude.has(ent.name)) continue;
    const srcPath = path.join(src, ent.name);
    const destPath = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer?.trim() ?? "");
    });
  });
}

async function main() {
  log("========================================", colors.green);
  log("  OpenClaw Telegram Proxy 安装脚本", colors.green);
  log("========================================", colors.green);
  console.log("");

  let sourcePath = findSourcePathSync();
  if (!sourcePath) {
    log("未找到插件，正在从 GitHub 下载...", colors.yellow);
    sourcePath = await fetchFromGitHub();
  }
  if (!sourcePath) {
    log("错误: 无法获取插件", colors.red);
    log("请选择以下方式之一：", colors.yellow);
    log(`  1. Git:  git clone ${GITHUB_REPO} && cd openclaw-telegram-proxy && node install.js`);
    log(`  2. NPM:  npm install -g ${PLUGIN_NAME}`);
    process.exit(1);
  }

  log(`✓ 插件路径: ${sourcePath}`, colors.green);
  console.log("");

  const realHome = resolveRealHome();
  const extDir = path.join(realHome, ".openclaw", "extensions");
  const pluginDir = path.join(extDir, PLUGIN_NAME);

  if (!fs.existsSync(extDir)) {
    log(`创建 OpenClaw 插件目录: ${extDir}`, colors.yellow);
    fs.mkdirSync(extDir, { recursive: true });
  }

  if (fs.existsSync(pluginDir)) {
    log(`⚠️  已存在，将覆盖: ${pluginDir}`, colors.yellow);
    fs.rmSync(pluginDir, { recursive: true, force: true });
  }

  log("复制文件到 OpenClaw 插件目录...", colors.green);
  copyDir(sourcePath, pluginDir);
  if (fs.existsSync(path.join(pluginDir, "node_modules"))) {
    fs.rmSync(path.join(pluginDir, "node_modules"), { recursive: true, force: true });
  }
  log("✓ 复制完成", colors.green);
  console.log("");

  const configPath = path.join(realHome, ".openclaw", "openclaw.json");

  // proxyUrl: argv > env > interactive
  let proxyUrl =
    (process.argv[2] && process.argv[2].trim().replace(/\/$/, "")) ||
    (process.env.OPENCLAW_TELEGRAM_PROXY_URL &&
      process.env.OPENCLAW_TELEGRAM_PROXY_URL.trim().replace(/\/$/, ""));

  if (!proxyUrl && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const configure = await question(rl, "是否现在配置 proxyUrl？(y/n，回车跳过): ");
    rl.close();
    if (configure.toLowerCase() === "y") {
      const rl2 = createInterface({ input: process.stdin, output: process.stdout });
      proxyUrl = await question(
        rl2,
        "请输入 proxyUrl (例如 https://telegram-proxy.xxx.workers.dev): "
      );
      rl2.close();
      proxyUrl = proxyUrl?.trim().replace(/\/$/, "") ?? "";
    }
  }

  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch {
    // ignore
  }

  config.plugins = config.plugins || {};
  config.plugins.entries = config.plugins.entries || {};
  config.plugins.entries[PLUGIN_NAME] = {
    enabled: true,
    config: { proxyUrl: proxyUrl || "" },
  };

  config.plugins.installs = config.plugins.installs || {};
  let version = "";
  try {
    const pkgPath = path.join(pluginDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      version = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version ?? "";
    }
  } catch {
    // ignore
  }
  config.plugins.installs[PLUGIN_NAME] = {
    source: "npm",
    spec: PLUGIN_NAME,
    installPath: pluginDir,
    ...(version && { version }),
    installedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  log(`✓ 已添加配置: ${configPath}`, colors.green);
  if (proxyUrl) {
    log(`  proxyUrl = ${proxyUrl}`, colors.green);
  } else {
    log("  请编辑 ~/.openclaw/openclaw.json 中的 proxyUrl", colors.yellow);
  }
  console.log("");
  log("✓ 安装完成！", colors.green);
  console.log("");
  log("下一步：", colors.yellow);
  if (!proxyUrl) {
    log("1. 编辑 proxyUrl: 手动编辑 ~/.openclaw/openclaw.json");
    log("2. 重启 OpenClaw（必须）: openclaw gateway restart");
  } else {
    log("  重启 OpenClaw（必须）: openclaw gateway restart");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
