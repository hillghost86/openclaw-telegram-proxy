# OpenClaw Telegram Proxy

一个 OpenClaw 插件，用于替换 Telegram API 地址为自定义反向代理，解决中国地区无法直接访问 `api.telegram.org` 的问题。

## 背景

在中国大陆地区，Telegram API (`api.telegram.org`) 被防火墙封锁，导致 OpenClaw 的 Telegram 频道无法正常工作。

本插件通过拦截所有 HTTP 请求，自动将 `api.telegram.org` 替换为用户指定的反向代理地址。

## 功能

- ✅ 自动拦截所有 Telegram API 请求
- ✅ 将 `api.telegram.org` 替换为自定义代理
- ✅ 支持配置热重载
- ✅ 不影响其他网络请求
- ✅ 无需修改 OpenClaw 源码

## 如何使用

### 方法 1: Git Clone（推荐）

```bash
cd ~/.openclaw/extensions
git clone https://github.com/hillghost86/openclaw-telegram-proxy.git
cd openclaw-telegram-proxy
```

### 方法 2: 手动下载

```bash
# 创建插件目录
mkdir -p ~/.openclaw/extensions/openclaw-telegram-proxy

# 下载所有必要文件
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/index.ts https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/index.ts
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/package.json https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/package.json
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/openclaw.plugin.json https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/openclaw.plugin.json
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/worker.js https://raw.githubusercontent.com/hillghost86/openclaw-telegram-proxy/main/worker.js
```



## 快速配置

### 1. 编辑 OpenClaw 配置文件

```bash
# 编辑 OpenClaw 配置
openclaw config edit
```

在配置中添加：

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
- `https://telegram-proxy.hillghost86.workers.dev` (Cloudflare Workers)


### 2. 重启 OpenClaw

```bash
# 重启使配置生效
openclaw gateway restart
```

### 3. 验证插件是否生效

查看 OpenClaw 日志，应该看到：

```
[openclaw-telegram-proxy] Applied proxy: https://your-proxy-domain.com
```

如果看到：
```
[openclaw-telegram-proxy] No plugin URL configured, using direct connection
```

说明配置有问题，请检查 `proxyUrl` 是否正确设置。

## 反向代理部署

本插件需要配合 Telegram API 反向代理使用。以下是推荐方案：

### Cloudflare Workers（推荐）

Cloudflare Workers 是免费的全球边缘计算平台，非常适合作为 Telegram API 代理。

**优点：**
- ✅ 免费使用（每天 100,000 次请求）
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 无需服务器
- ✅ 部署简单

**部署步骤：**

1. 访问 https://dash.cloudflare.com
2. 进入 **Workers & Pages**
3. 点击 **Create application**
4. 应用名称：`telegram-proxy`（或其他你喜欢的）
5. 创建类型：**Create Worker**
6. 选择 **Hello World** 模板
7. 编辑 Worker，粘贴 `worker.js` 代码
8. 保存并部署

部署成功后，你会得到一个 URL，例如：
```
https://telegram-proxy.hillghost86.workers.dev
```

**使用 Worker：**

部署成功后，配置到 OpenClaw 的 `proxyUrl` 即可。

### 使用现成服务

- 其他社区代理 - 搜索 "telegram bot api proxy"

### 自建 Nginx 反向代理

需要一台境外的服务器（VPS），详细配置请参考 README 中的完整说明。

## 工作原理

1. **插件注册**: 在 OpenClaw 启动时加载插件
2. **配置读取**: 从配置文件读取 `plugins.entries.openclaw-telegram-proxy.config.proxyUrl`
3. **Fetch 拦截**: 替换全局 `fetch` 函数为自定义版本
4. **URL 替换**: 检测所有请求 URL，如果包含 `api.telegram.org`，则替换为 `proxyUrl`
5. **透明代理**: 其他网络请求不受影响

## 故障排除

### 插件未生效

**问题**: 日志显示 `No plugin config found`

**解决**:
1. 检查配置文件路径是否正确
2. 确认 JSON 格式正确（无语法错误）
3. 重启 OpenClaw

### Telegram 仍然无法连接

**问题**: 插件已加载，但 Telegram 仍然无法工作

**解决**:
1. 测试反向代理地址是否可访问：`curl https://your-proxy-domain.com`
2. 检查反向代理是否正确转发到 `api.telegram.org`
3. 查看 OpenClaw 详细日志：`openclaw logs --follow`
4. 确认 Telegram Bot Token 是否有效

### Cloudflare Workers 配额用尽

**问题**: Worker 返回 429 Too Many Requests 错误

**解决**:
1. 升级到 Workers Paid 计划
2. 减少不必要的请求
3. 查看 Workers Metrics 了解请求量

## 开发

### 本地测试

```bash
# 复制插件到本地目录
cp -r /path/to/plugin ~/.openclaw/extensions/openclaw-telegram-proxy

# 重启 OpenClaw
openclaw gateway restart

# 查看日志
openclaw logs --follow | grep telegram-proxy
```

## 许可证

MIT License - 详见项目中的 [LICENSE](LICENSE) 文件

## 作者

- **作者**: hillghost86
- **GitHub**: [hillghost86](https://github.com/hillghost86)

## 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - OpenClaw 项目
- [Cloudflare](https://workers.cloudflare.com/) - Cloudflare Workers 平台
- 社区反馈 - 帮助测试和改进

## 相关链接

- [OpenClaw 文档](https://docs.openclaw.ai)
- [OpenClaw Discord](https://discord.com/invite/clawd)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
