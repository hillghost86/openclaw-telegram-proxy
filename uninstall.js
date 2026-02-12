#!/usr/bin/env node

/**
 * OpenClaw Telegram Proxy 插件卸载脚本 (Node.js)
 *
 * 用法:
 *   node uninstall.js
 *   REMOVE_CONFIG=1 node uninstall.js  # 非交互式自动移除配置
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createInterface } from "node:readline";

const PLUGIN_NAME = "openclaw-telegram-proxy";

const colors = {
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

function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer?.trim() ?? "");
    });
  });
}

async function main() {
  log("========================================", colors.green);
  log("  OpenClaw Telegram Proxy 卸载", colors.green);
  log("========================================", colors.green);
  console.log("");

  const realHome = resolveRealHome();
  const pluginDir = path.join(realHome, ".openclaw", "extensions", PLUGIN_NAME);
  const configPath = path.join(realHome, ".openclaw", "openclaw.json");

  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true, force: true });
    log(`✓ 已删除插件: ${pluginDir}`, colors.green);
  } else {
    log(`插件未安装: ${pluginDir}`, colors.yellow);
  }

  let removeConfig =
    ["1", "y", "Y", "true"].includes(process.env.REMOVE_CONFIG?.trim() ?? "") ||
    false;

  if (!removeConfig && process.stdin.isTTY && fs.existsSync(configPath)) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await question(
      rl,
      "是否从配置文件中移除插件配置？(y/n，回车跳过): "
    );
    rl.close();
    removeConfig = answer.toLowerCase() === "y";
  }

  if (removeConfig && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      let changed = false;

      if (config.plugins?.entries?.[PLUGIN_NAME]) {
        delete config.plugins.entries[PLUGIN_NAME];
        changed = true;
      }
      if (config.plugins?.installs?.[PLUGIN_NAME]) {
        delete config.plugins.installs[PLUGIN_NAME];
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        log("✓ 已从配置中移除插件", colors.green);
      } else {
        log("配置中未找到插件项", colors.yellow);
      }
    } catch (err) {
      log("配置移除失败: " + String(err), colors.yellow);
    }
  }

  console.log("");
  log("✓ 卸载完成", colors.green);
  log(`若通过 NPM 安装，可执行: npm uninstall -g ${PLUGIN_NAME}`, colors.yellow);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
