# 快速开始

## 当前用户（测试插件）

插件已安装到 `~/.openclaw/extensions/openclaw-telegram-proxy/`。

配置已更新到 `~/.openclaw/openclaw.json`。

**重启 OpenClaw：**

```bash
openclaw gateway restart
```

## GitHub 发布步骤

1. 在 GitHub 创建新仓库: `openclaw-telegram-proxy`
2. 推送代码:

```bash
cd /Users/mr-mac/.openclaw/workspace/openclaw-telegram-proxy
git init
git add .
git commit -m "Initial release v1.0.0"
git branch -M main

# 替换 YOUR_USERNAME
git remote add origin https://github.com/YOUR_USERNAME/openclaw-telegram-proxy.git
git push -u origin main
```

3. 在 GitHub 创建 Release: `v1.0.0`

## NPM 发布步骤

1. 登录 NPM: `npm login`
2. 发布: `npm publish`

## 注意事项

⚠️ **发布前需要替换以下占位符：**

- `YOUR_USERNAME` → 你的 GitHub 用户名

- 在 `README.md` 中的 GitHub 链接
- 在 `package.json` 中的 repository 和 bugs URL
- 在 `PUBLISH.md` 中的 GitHub 链接

**替换完成后，删除本文件中的占位符说明。**
