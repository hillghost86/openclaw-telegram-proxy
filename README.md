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

## 安装

### 方式 1: 手动安装（推荐）

```bash
# 创建插件目录
mkdir -p ~/.openclaw/extensions/openclaw-telegram-proxy

# 下载插件文件
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/index.ts https://raw.githubusercontent.com/yourusername/openclaw-telegram-proxy/main/index.ts
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/package.json https://raw.githubusercontent.com/yourusername/openclaw-telegram-proxy/main/package.json
curl -o ~/.openclaw/extensions/openclaw-telegram-proxy/openclaw.plugin.json https://raw.githubusercontent.com/yourusername/openclaw-telegram-proxy/main/openclaw.plugin.json
```

### 方式 2: Git Clone

```bash
cd ~/.openclaw/extensions
git clone https://github.com/yourusername/openclaw-telegram-proxy.git
cd openclaw-telegram-proxy
```

### 方式 3: NPM 安装（计划中）

```bash
npm install -g openclaw-telegram-proxy
```

## 配置

编辑 OpenClaw 配置文件 (`~/.openclaw/openclaw.json`)：

```json
{
  "plugins": {
    "entries": {
      "openclaw-telegram-proxy": {
        "enabled": true,
        "config": {
          "proxyUrl": "https://tgapi.dfcer.com"
        }
      }
    }
  }
}
```

### 配置说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `proxyUrl` | string | 是 | Telegram API 反向代理地址 |
| `enabled` | boolean | 否 | 是否启用插件，默认 `true` |

### 反向代理地址格式

必须以 `https://` 或 `http://` 开头，例如：

- `https://tgapi.dfcer.com`
- `https://api.telegram.org.myproxy.com`

## 使用

配置完成后，重启 OpenClaw：

```bash
# 方式 1: 如果作为服务运行
openclaw gateway restart

# 方式 2: 如果使用 systemd
systemctl restart openclaw

# 方式 3: 停止后重新启动
pkill -f openclaw
openclaw gateway start
```

### 验证插件是否生效

查看 OpenClaw 日志，应该看到类似输出：

```
[openclaw-telegram-proxy] Applied proxy: https://tgapi.dfcer.com
```

如果看到：

```
[openclaw-telegram-proxy] No proxy URL configured, using direct connection
```

说明配置有问题，请检查 `proxyUrl` 是否正确设置。

## 工作原理

1. **插件注册**: 在 OpenClaw 启动时加载插件
2. **配置读取**: 从配置文件读取 `plugins.entries.openclaw-telegram-proxy.config.proxyUrl`
3. **Fetch 拦截**: 替换全局 `fetch` 函数为自定义版本
4. **URL 替换**: 检测所有请求 URL，如果包含 `api.telegram.org`，则替换为 `proxyUrl`
5. **透明代理**: 其他网络请求不受影响

## 反向代理搭建

你需要一个 Telegram API 反向代理。以下是几种搭建方式：

### 方式 1: 使用现成服务

- **tgapi.dfcer.com** - 社区提供的代理（可能不稳定）
- 其他社区代理 - 搜索 "telegram bot api proxy"

### 方式 2: 自建 Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name tgapi.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass https://api.telegram.org;
        proxy_set_header Host api.telegram.org;
        proxy_ssl_server_name on;
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
    }
}
```

### 方式 3: Cloudflare Workers

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = "api.telegram.org";
    
    const newRequest = new Request(url, request);
    return fetch(newRequest);
  }
}
```

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
1. 测试反向代理地址是否可访问：`curl https://tgapi.dfcer.com`
2. 检查反向代理是否正确转发到 `api.telegram.org`
3. 查看 OpenClaw 详细日志：`openclaw logs --follow`
4. 确认 Telegram Bot Token 是否有效

### 其他网络请求受影响

**问题**: 其他网站无法访问

**解决**: 本插件只拦截包含 `api.telegram.org` 的请求，不应该影响其他网络。如果出现问题，请提交 Issue。

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

### 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 作者

- **作者**: DeepForceCryptoer
- **GitHub**: [yourusername](https://github.com/yourusername)

## 致谢

- [OpenClaw](https://github.com/openclaw/openclaw) - OpenClaw 项目
- 社区反馈 - 帮助测试和改进

## 更新日志

### v1.0.0 (2026-02-03)

- 🎉 首次发布
- ✅ 支持自动拦截 Telegram API 请求
- ✅ 支持自定义反向代理地址
- ✅ 支持配置热重载

## 相关链接

- [OpenClaw 文档](https://docs.openclaw.ai)
- [OpenClaw Discord](https://discord.com/invite/clawd)
- [Telegram Bot API](https://core.telegram.org/bots/api)
