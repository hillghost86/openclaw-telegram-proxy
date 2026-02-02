#!/bin/bash

# OpenClaw Telegram Proxy 插件安装脚本
# 自动将 NPM 包复制到 OpenClaw 插件目录

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 配置
PLUGIN_NAME="openclaw-telegram-proxy"
EXT_DIR="$HOME/.openclaw/extensions"
PLUGIN_DIR="$EXT_DIR/$PLUGIN_NAME"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OpenClaw Telegram Proxy 安装脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 NPM 是否已安装
if ! npm list -g "$PLUGIN_NAME" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  $PLUGIN_NAME 未安装${NC}"
    echo -e "${YELLOW}请先运行: npm install -g $PLUGIN_NAME${NC}"
    exit 1
fi

# 获取 NPM 安装路径
NPM_PATH=$(npm root -g "$PLUGIN_NAME" | tr -d '\n')
echo -e "${GREEN}✓ NPM 包安装路径:${NC} $NPM_PATH"
echo ""

# 检查 OpenClaw 插件目录是否存在
if [ ! -d "$EXT_DIR" ]; then
    echo -e "${YELLOW}创建 OpenClaw 插件目录: $EXT_DIR${NC}"
    mkdir -p "$EXT_DIR"
fi

# 创建插件目录
if [ -d "$PLUGIN_DIR" ]; then
    echo -e "${YELLOW}⚠️  已存在，将覆盖: $PLUGIN_DIR${NC}"
    rm -rf "$PLUGIN_DIR"
fi

# 复制文件
echo -e "${GREEN}复制文件到 OpenClaw 插件目录...${NC}"
mkdir -p "$PLUGIN_DIR"
cp -r "$NPM_PATH/"* "$PLUGIN_DIR/"
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
echo -e "${YELLOW}下一步：${NC}"
echo -e "${YELLOW}1. 配置 OpenClaw: 编辑 ~/.openclaw/openclaw.json${NC}"
echo -e "${YELLOW}2. 添加插件配置:${NC}"
echo -e "${YELLOW}3. 重启 OpenClaw: openclaw gateway restart${NC}"
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
