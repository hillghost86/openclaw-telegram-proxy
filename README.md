# OpenClaw Telegram Proxy

一个 OpenClaw 插件，用于替换 Telegram API 地址为自定义反向代理，解决中国地区 OpenClaw 无法直接使用 Telegram 接收和回复消息的问题。

## 背景

在中国大陆地区，Telegram API (`api.telegram.org`) 被防火墙封锁，导致 OpenClaw 的 Telegram 频道无法正常工作。

本插件通过拦截所有 HTTP 请求，自动将 `api.telegram.org` 替换为用户指定的反向代理地址。反向代理可使用 Cloudflare Workers 实现。

## 功能

- ✅ 自动拦截所有 Telegram API 请求
- ✅ 将 `api.telegram.org` 替换为自定义代理
- ✅ 支持配置热重载
- ✅ 不影响其他网络请求
- ✅ 无需修改 OpenClaw 源码

## 安装

### 方法 1: 直接下载（最简单）

```bash
curl -sSL https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/install.sh | bash
```

> 此命令会先下载 install.sh，脚本会自动从 GitHub 拉取完整插件并安装，无需提前 clone 或 npm 安装。

### 方法 2: Git Clone

```bash
git clone https://github.com/hillghost86/openclaw-telegram-proxy.git
cd openclaw-telegram-proxy
./install.sh
```

### 方法 3: NPM

```bash
npm install -g openclaw-telegram-proxy
```

安装脚本会自动将插件复制到 `~/.openclaw/extensions/`，并可交互式配置 proxyUrl。

### 安装时自动配置 proxyUrl

```bash
# 命令行参数
./install.sh https://your-proxy.com

# 环境变量
OPENCLAW_TELEGRAM_PROXY_URL=https://your-proxy.com npm install -g openclaw-telegram-proxy
```

## 配置

### 1. 编辑配置文件

若安装时未配置 proxyUrl，可执行：

```bash
openclaw config edit
```

在 `plugins.entries` 中添加：

```json
{
  "plugins": {
    "entries": {
      "openclaw-telegram-proxy": {
        "enabled": true,
        "config": {
          "proxyUrl": "https://your-proxy-domain.com"
        }
      }
    }
  }
}
```

**重要**: 将 `https://your-proxy-domain.com` 替换为你实际的反向代理地址，例如：
- `https://telegram-proxy.xxx.workers.dev` (Cloudflare Workers)

### 2. 重启 OpenClaw

```bash
openclaw gateway restart
```

### 3. 验证

查看 OpenClaw 日志，应看到：

```
[openclaw-telegram-proxy] Applied proxy: https://your-proxy-domain.com
```

若看到 `No plugin URL configured, using direct connection`，说明 proxyUrl 未正确配置。

## 反向代理部署

### Cloudflare Workers（推荐）

**优点：** 免费、全球 CDN、自动 HTTPS、无需服务器

**部署步骤：**

1. 访问 https://dash.cloudflare.com
2. 进入 **Workers & Pages** → **Create application** → **Create Worker**
3. 选择 **Hello World** 模板
4. 编辑 Worker，粘贴 `cloudflare/worker.js` 中的代码
5. 保存并部署
6. （可选）在 DNS 中绑定自定义域名

部署成功后获得 URL，例如：`https://telegram-proxy.xxx.workers.dev`

### 使用现成服务

搜索 "telegram bot api proxy" 获取社区代理服务。

## 卸载

### 使用卸载脚本

```bash
cd ~/.openclaw/extensions/openclaw-telegram-proxy
./uninstall.sh
```

### 手动卸载

```bash
rm -rf ~/.openclaw/extensions/openclaw-telegram-proxy
openclaw config edit  # 移除插件配置
npm uninstall -g openclaw-telegram-proxy  # 若通过 NPM 安装
```

## 工作原理

1. **插件注册**: OpenClaw 启动时加载插件
2. **配置读取**: 从 `plugins.entries.openclaw-telegram-proxy.config.proxyUrl` 读取代理地址
3. **Fetch 拦截**: 替换全局 `fetch` 函数
4. **URL 替换**: 将 `api.telegram.org` 替换为 proxyUrl
5. **透明代理**: 其他请求不受影响

## 故障排除

### 插件未生效

- 检查 `~/.openclaw/openclaw.json` 中 proxyUrl 是否正确
- 确认 JSON 格式无误
- 执行 `openclaw gateway restart`

### Telegram 无法连接

- 测试代理：`curl https://your-proxy-domain.com`
- 查看日志：`openclaw logs --follow`
- 确认 Bot Token 有效

### Cloudflare Workers 429 错误

- 升级 Workers Paid 计划
- 或减少请求频率

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 作者

- **hillghost86** - [GitHub](https://github.com/hillghost86)

## 相关链接

- [OpenClaw 文档](https://docs.openclaw.ai)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
