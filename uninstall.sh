#!/usr/bin/env bash

# OpenClaw Telegram Proxy 插件卸载脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

PLUGIN_NAME="openclaw-telegram-proxy"
if [ -n "$SUDO_USER" ]; then
    REAL_HOME=$(eval echo "~$SUDO_USER")
else
    REAL_HOME="${HOME:-$(eval echo ~)}"
fi
PLUGIN_DIR="$REAL_HOME/.openclaw/extensions/$PLUGIN_NAME"
CONFIG_FILE="$REAL_HOME/.openclaw/openclaw.json"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OpenClaw Telegram Proxy 卸载${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 删除插件目录
if [ -d "$PLUGIN_DIR" ]; then
    rm -rf "$PLUGIN_DIR"
    echo -e "${GREEN}✓ 已删除插件: $PLUGIN_DIR${NC}"
else
    echo -e "${YELLOW}插件未安装: $PLUGIN_DIR${NC}"
fi

# 可选：从配置中移除插件项
if [ -f "$CONFIG_FILE" ] && command -v node > /dev/null 2>&1; then
    if [ -t 0 ]; then
        echo -e "${YELLOW}是否从配置文件中移除插件配置？(y/n，回车跳过):${NC}"
        read -r REMOVE_CONFIG
        if [ "$REMOVE_CONFIG" = "y" ] || [ "$REMOVE_CONFIG" = "Y" ]; then
            if HOME="$REAL_HOME" node -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(process.env.HOME || '', '.openclaw', 'openclaw.json');
try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (config.plugins?.entries?.['openclaw-telegram-proxy']) {
    delete config.plugins.entries['openclaw-telegram-proxy'];
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    process.exit(0);
  }
  process.exit(1);
} catch (e) {
  process.exit(1);
}
" 2>/dev/null; then
                echo -e "${GREEN}✓ 已从配置中移除插件${NC}"
            else
                echo -e "${YELLOW}配置中未找到插件项，或移除失败${NC}"
            fi
        fi
    fi
fi

echo ""
echo -e "${GREEN}✓ 卸载完成${NC}"
echo -e "${YELLOW}若通过 NPM 安装，可执行: npm uninstall -g $PLUGIN_NAME${NC}"
