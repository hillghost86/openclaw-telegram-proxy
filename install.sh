#!/usr/bin/env bash

# OpenClaw Telegram Proxy 插件安装脚本
# 自动将插件复制到 OpenClaw 插件目录
#
# 支持三种安装方式:
#   1. Git Clone: git clone $GITHUB_REPO && cd openclaw-telegram-proxy && ./install.sh
#   2. NPM:       npm install -g openclaw-telegram-proxy
#   3. 直接下载:  curl -sSL https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/install.sh | bash
#
# 用法:
#   bash install.sh                    # 交互式配置
#   bash install.sh https://proxy.com   # 命令行参数自动配置
#   OPENCLAW_TELEGRAM_PROXY_URL=https://proxy.com bash install.sh  # 环境变量自动配置

set -e

GITHUB_REPO="https://github.com/hillghost86/openclaw-telegram-proxy.git"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 配置
PLUGIN_NAME="openclaw-telegram-proxy"
# 使用 sudo 时，写入实际用户的 home（兼容 Linux/macOS）
if [ -n "$SUDO_USER" ]; then
    REAL_HOME=$(eval echo "~$SUDO_USER")
else
    REAL_HOME="${HOME:-$(eval echo ~)}"
fi
EXT_DIR="$REAL_HOME/.openclaw/extensions"
PLUGIN_DIR="$EXT_DIR/$PLUGIN_NAME"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OpenClaw Telegram Proxy 安装脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 确定源路径：1.脚本所在目录 2.当前目录 3.npm 4.从 GitHub 下载
SOURCE_PATH=""
# 1. 脚本所在目录（支持从任意位置运行 install.sh）
if [ -n "${BASH_SOURCE[0]}" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/index.ts" ] && [ -f "$SCRIPT_DIR/openclaw.plugin.json" ]; then
        SOURCE_PATH="$SCRIPT_DIR"
    fi
fi
# 2. 当前目录
if [ -z "$SOURCE_PATH" ] && [ -f "index.ts" ] && [ -f "openclaw.plugin.json" ]; then
    SOURCE_PATH="$(pwd)"
fi
# 3. NPM 全局安装
if [ -z "$SOURCE_PATH" ] && npm list -g "$PLUGIN_NAME" > /dev/null 2>&1; then
    SOURCE_PATH="$(npm root -g | tr -d '\n')/$PLUGIN_NAME"
fi
# 4. 从 GitHub 下载
CLEANUP_TEMP=""
if [ -z "$SOURCE_PATH" ]; then
    echo -e "${YELLOW}未找到插件，正在从 GitHub 下载...${NC}"
    TEMP_DIR=$(mktemp -d 2>/dev/null || echo "/tmp/openclaw-telegram-proxy-$$")
    mkdir -p "$TEMP_DIR"
    if command -v git > /dev/null 2>&1; then
        if git clone --depth 1 "$GITHUB_REPO" "$TEMP_DIR" 2>/dev/null; then
            SOURCE_PATH="$TEMP_DIR"
            CLEANUP_TEMP="$TEMP_DIR"
            echo -e "${GREEN}✓ 下载完成${NC}"
        fi
    fi
    if [ -z "$SOURCE_PATH" ] && command -v curl > /dev/null 2>&1; then
        ZIP_FILE="$TEMP_DIR/main.zip"
        if curl -sL "https://github.com/hillghost86/openclaw-telegram-proxy/archive/refs/heads/main.zip" -o "$ZIP_FILE" 2>/dev/null; then
            if command -v unzip > /dev/null 2>&1; then
                unzip -q "$ZIP_FILE" -d "$TEMP_DIR" 2>/dev/null
                SOURCE_PATH="$TEMP_DIR/openclaw-telegram-proxy-main"
                CLEANUP_TEMP="$TEMP_DIR"
                echo -e "${GREEN}✓ 下载完成${NC}"
            fi
        fi
    fi
    if [ -z "$SOURCE_PATH" ]; then
        rm -rf "$TEMP_DIR" 2>/dev/null || true
        echo -e "${RED}错误: 无法获取插件${NC}"
        echo -e "${YELLOW}请选择以下方式之一：${NC}"
        echo -e "${YELLOW}  1. Git:  git clone $GITHUB_REPO && cd openclaw-telegram-proxy && ./install.sh${NC}"
        echo -e "${YELLOW}  2. NPM:  npm install -g $PLUGIN_NAME${NC}"
        exit 1
    fi
fi

NPM_PATH="$SOURCE_PATH"
echo -e "${GREEN}✓ 插件路径:${NC} $NPM_PATH"
echo ""

# 检查 OpenClaw 插件目录
if [ ! -d "$EXT_DIR" ]; then
    echo -e "${YELLOW}创建 OpenClaw 插件目录: $EXT_DIR${NC}"
    mkdir -p "$EXT_DIR"
fi

if [ -d "$EXT_DIR" ] && ! [ -w "$EXT_DIR" ]; then
    echo -e "${RED}错误: 无写入权限 $EXT_DIR${NC}"
    exit 1
fi

# 创建插件目录
if [ -d "$PLUGIN_DIR" ]; then
    echo -e "${YELLOW}⚠️  已存在，将覆盖: $PLUGIN_DIR${NC}"
    rm -rf "$PLUGIN_DIR"
fi

# 复制文件（排除 node_modules）
echo -e "${GREEN}复制文件到 OpenClaw 插件目录...${NC}"
mkdir -p "$PLUGIN_DIR"
if command -v rsync > /dev/null 2>&1; then
    rsync -a --exclude='node_modules' --exclude='.git' "$NPM_PATH/" "$PLUGIN_DIR/"
else
    cp -r "$NPM_PATH"/. "$PLUGIN_DIR/"
    rm -rf "$PLUGIN_DIR/node_modules" 2>/dev/null || true
fi
# 使用 sudo 时，将文件所有权归还给实际用户（Linux/macOS 均支持）
if [ -n "$SUDO_USER" ] && [ -n "$SUDO_UID" ] && [ -n "$SUDO_GID" ]; then
    chown -R "$SUDO_UID:$SUDO_GID" "$PLUGIN_DIR" 2>/dev/null || true
fi
echo -e "${GREEN}✓ 复制完成${NC}"
echo ""

# 显示文件列表
echo -e "${GREEN}安装的文件:${NC}"
ls -la "$PLUGIN_DIR/"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ 安装完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 配置 proxyUrl：支持命令行参数、环境变量、交互式输入
CONFIG_FILE="$REAL_HOME/.openclaw/openclaw.json"
PROXY_URL=""
# 1. 命令行参数优先
if [ -n "$1" ]; then
    PROXY_URL=$(echo "$1" | tr -d '[:space:]')
    PROXY_URL="${PROXY_URL%/}"
fi
# 2. 环境变量
if [ -z "$PROXY_URL" ] && [ -n "$OPENCLAW_TELEGRAM_PROXY_URL" ]; then
    PROXY_URL=$(echo "$OPENCLAW_TELEGRAM_PROXY_URL" | tr -d '[:space:]')
    PROXY_URL="${PROXY_URL%/}"
fi
# 3. 交互式输入（仅在有 TTY 且未通过参数/环境变量设置时）
if [ -z "$PROXY_URL" ] && [ -t 0 ]; then
    echo -e "${YELLOW}是否现在配置 proxyUrl？(y/n，回车跳过):${NC}"
    read -r CONFIGURE_NOW
    if [ "$CONFIGURE_NOW" = "y" ] || [ "$CONFIGURE_NOW" = "Y" ]; then
        echo -e "${YELLOW}请输入 proxyUrl (例如 https://telegram-proxy.xxx.workers.dev):${NC}"
        read -r PROXY_URL
        PROXY_URL=$(echo "$PROXY_URL" | tr -d '[:space:]')
        PROXY_URL="${PROXY_URL%/}"
    fi
fi
# 写入配置（始终添加插件配置结构、installs 记录以支持 npm 升级，proxyUrl 可为空）
CONFIG_WRITTEN=false
if command -v node > /dev/null 2>&1; then
    if HOME="$REAL_HOME" PROXY_URL="$PROXY_URL" PLUGIN_DIR="$PLUGIN_DIR" node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json');
let config = {};
try {
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {}
config.plugins = config.plugins || {};
config.plugins.entries = config.plugins.entries || {};
config.plugins.entries['openclaw-telegram-proxy'] = {
  enabled: true,
  config: { proxyUrl: process.env.PROXY_URL || '' }
};
// 添加 installs 记录以支持 openclaw plugins update
config.plugins.installs = config.plugins.installs || {};
let version = '';
try {
  const pkgPath = path.join(process.env.PLUGIN_DIR || '', 'package.json');
  if (fs.existsSync(pkgPath)) {
    version = (JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '');
  }
} catch (e) {}
config.plugins.installs['openclaw-telegram-proxy'] = {
  source: 'npm',
  spec: 'openclaw-telegram-proxy',
  installPath: process.env.PLUGIN_DIR || '',
  version: version || undefined,
  installedAt: new Date().toISOString()
};
fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
" 2>/dev/null; then
        if [ -n "$SUDO_USER" ] && [ -n "$SUDO_UID" ] && [ -n "$SUDO_GID" ] && [ -f "$CONFIG_FILE" ]; then
            chown "$SUDO_UID:$SUDO_GID" "$CONFIG_FILE" 2>/dev/null || true
        fi
        CONFIG_WRITTEN=true
        echo -e "${GREEN}✓ 已添加配置: $CONFIG_FILE${NC}"
        if [ -n "$PROXY_URL" ]; then
            echo -e "${GREEN}  proxyUrl = $PROXY_URL${NC}"
        else
            echo -e "${YELLOW}  请编辑 ~/.openclaw/openclaw.json 中的 proxyUrl${NC}"
        fi
    else
        echo -e "${YELLOW}无法自动写入配置，请手动编辑 $CONFIG_FILE${NC}"
    fi
fi
echo ""
if [ "$CONFIG_WRITTEN" = "true" ]; then
    echo -e "${YELLOW}下一步：${NC}"
    if [ -z "$PROXY_URL" ]; then
        echo -e "${YELLOW}1. 编辑 proxyUrl: 手动编辑 ~/.openclaw/openclaw.json${NC}"
        echo -e "${YELLOW}2. 重启 OpenClaw（必须）: openclaw gateway restart${NC}"
    else
        echo -e "${YELLOW}  重启 OpenClaw（必须）: openclaw gateway restart${NC}"
    fi
else
    echo -e "${YELLOW}下一步：${NC}"
    echo -e "${YELLOW}1. 配置 proxyUrl: 手动编辑 ~/.openclaw/openclaw.json${NC}"
    echo -e "${YELLOW}2. 重启 OpenClaw（必须）: openclaw gateway restart${NC}"
    echo ""
    echo -e "${YELLOW}示例配置：${NC}"
    echo -e "${YELLOW} plugins: {${NC}"
    echo -e "${YELLOW}   entries: {${NC}"
    echo -e "${YELLOW}     openclaw-telegram-proxy: {${NC}"
    echo -e "${YELLOW}       enabled: true,${NC}"
    echo -e "${YELLOW}       config: {${NC}"
    echo -e "${YELLOW}         proxyUrl: \"https://your-proxy.com\"${NC}"
    echo -e "${YELLOW}       }${NC}"
    echo -e "${YELLOW}     }${NC}"
    echo -e "${YELLOW}   }${NC}"
    echo -e "${YELLOW} }${NC}"
fi
# 清理临时下载目录
[ -n "$CLEANUP_TEMP" ] && [ -d "$CLEANUP_TEMP" ] && rm -rf "$CLEANUP_TEMP" 2>/dev/null || true
