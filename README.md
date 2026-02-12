# OpenClaw Telegram Proxy

一个 OpenClaw 插件，用于替换 Telegram API 地址为自定义反向代理，解决中国地区 OpenClaw 无法直接使用 Telegram 接收和回复消息的问题。（只是处理openclaw与telegram之间的通讯问题，用户与telegram之间的通讯请自行解决。）

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

### 方法 1: OpenClaw CLI（推荐）

```bash
# 从 npm 安装（需已发布）
openclaw plugins install openclaw-telegram-proxy


```

安装后按下方「配置」章节添加 proxyUrl，并执行 `openclaw gateway restart`。

### 方法 2: 直接下载

```bash
curl -sSL https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/install.sh | bash
```

> 此命令会先下载 install.sh，脚本会自动从 GitHub 拉取完整插件并安装。支持交互式配置 proxyUrl。

### 方法 3: Git Clone

```bash
git clone https://github.com/hillghost86/openclaw-telegram-proxy.git
cd openclaw-telegram-proxy
node install.js   # 或 ./install.sh
```

### 方法 4: NPM

```bash
npm install -g openclaw-telegram-proxy
```

NPM 安装会触发 `node install.js`，将插件复制到 `~/.openclaw/extensions/` 并写入配置骨架。若安装时未输入 proxyUrl，按下方「配置」章节补充。

> **Windows**: `install.js` / `uninstall.js` 支持 Windows。配置路径为 `%USERPROFILE%\.openclaw\openclaw.json`。直接下载方式（curl + bash）需 WSL 或 Git Bash。

## 配置

**安装方式**：`openclaw plugins install`、NPM 安装或直接下载后，若未交互式配置 proxyUrl，需手动编辑配置文件。

**配置路径**：`~/.openclaw/openclaw.json`（Windows: `%USERPROFILE%\.openclaw\openclaw.json`）

**操作步骤**：

1. 打开配置文件，在 `plugins.entries` 中加入或修改 `openclaw-telegram-proxy` 项：

```json
{
  "plugins": {
    "entries": {
      "openclaw-telegram-proxy": {
        "enabled": true,
        "config": {
          "proxyUrl": "https://telegram-proxy.xxx.workers.dev"
        }
      }
    }
  }
}
```

2. 将 `proxyUrl` 替换为你的反向代理地址（如 Cloudflare Workers 部署后的 URL）

3. 重启 OpenClaw：`openclaw gateway restart`

**验证**：日志中出现 `[openclaw-telegram-proxy] Applied proxy: https://...` 即表示配置生效。

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

## 升级

若通过 `openclaw plugins install` 或 `install.sh` 安装，配置中会包含 `plugins.installs` 记录，可使用：

```bash
openclaw plugins update openclaw-telegram-proxy
```

若通过 npm 安装，使用 `npm update -g openclaw-telegram-proxy` 后需手动执行 `./install.sh` 将更新复制到 `~/.openclaw/extensions/`。

## 卸载

### 方法 1: 一键卸载（推荐）

无需本地保留插件目录，直接从 GitHub 拉取脚本执行：

```bash
curl -sSL https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/uninstall.sh | bash
```

非交互式同时移除配置：`REMOVE_CONFIG=1` 环境变量 + 同上命令

### 方法 2: NPM 安装的

```bash
npm uninstall -g openclaw-telegram-proxy
```

会自动执行 preuninstall 脚本。非交互式移除配置：`REMOVE_CONFIG=1 npm uninstall -g openclaw-telegram-proxy`。

### 方法 3: 使用本地卸载脚本

若插件目录仍在，可执行：

```bash
~/.openclaw/extensions/openclaw-telegram-proxy/uninstall.sh
# 或
node ~/.openclaw/extensions/openclaw-telegram-proxy/uninstall.js
```

### 方法 4: 手动卸载

```bash
rm -rf ~/.openclaw/extensions/openclaw-telegram-proxy
# 手动编辑 ~/.openclaw/openclaw.json 移除 plugins.entries 和 plugins.installs 中的 openclaw-telegram-proxy 项
```

## 工作原理

1. **插件注册**: OpenClaw 启动时加载插件
2. **配置读取**: 从 `plugins.entries.openclaw-telegram-proxy.config.proxyUrl` 读取代理地址
3. **Fetch 拦截**: 替换全局 `fetch` 函数
4. **URL 替换**: 将 `api.telegram.org` 替换为 proxyUrl
5. **透明代理**: 其他请求不受影响

## 故障排除

### 调试日志

设置环境变量可输出详细日志：

```bash
OPENCLAW_TELEGRAM_PROXY_DEBUG=1 openclaw gateway start
```

或启动前 `export OPENCLAW_TELEGRAM_PROXY_DEBUG=1`。日志会包含：插件配置、proxyUrl 是否生效、gateway 启动时的 fetch 替换状态。

### 插件未生效

- 手动编辑 `~/.openclaw/openclaw.json`，检查 proxyUrl 是否正确
- 确认 JSON 格式无误：`plugins.entries["openclaw-telegram-proxy"].config.proxyUrl`
- **必须重启**：执行 `openclaw gateway restart`
- 若同时配置了 `channels.telegram.accounts[].proxy`（SOCKS/HTTP 代理），该配置优先，本插件的 URL 替换不会生效。使用反向代理时请移除 channels.telegram 的 proxy 配置。

### Telegram 无法连接

- 测试代理：`curl https://your-proxy-domain.com/bot<token>/getMe`
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
