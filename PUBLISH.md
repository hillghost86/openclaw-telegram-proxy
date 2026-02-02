# OpenClaw Telegram Proxy

OpenClaw Telegram API proxy plugin for China region access.

## 项目结构

```
openclaw-telegram-proxy/
├── index.ts              # 插件主代码
├── package.json          # NPM 包配置
├── openclaw.plugin.json # OpenClaw 插件配置
├── README.md            # 项目文档
└── LICENSE              # MIT 许可证
```

## 发布到 GitHub

### 1. 初始化 Git 仓库

```bash
cd /Users/mr-mac/.openclaw/workspace/openclaw-telegram-proxy

git init
git add .
git commit -m "Initial commit: OpenClaw Telegram Proxy plugin v1.0.0"
```

### 2. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称: `openclaw-telegram-proxy`
3. 描述: `OpenClaw plugin to replace api.telegram.org with custom proxy for Telegram access in restricted regions`
4. 选择 Public
5. 不要添加 README、LICENSE 等（已经包含了）
6. 点击 "Create repository"

### 3. 推送到 GitHub

```bash
# 替换 YOUR_USERNAME 为你的 GitHub 用户名
git remote add origin https://github.com/YOUR_USERNAME/openclaw-telegram-proxy.git
git branch -M main
git push -u origin main
```

### 4. 添加 GitHub Release

1. 访问仓库页面
2. 点击 "Releases" → "Create a new release"
3. 标签: `v1.0.0`
4. 标题: `v1.0.0 - Initial Release`
5. 描述:
```
## 🎉 首次发布

### 功能
- ✅ 自动拦截 Telegram API 请求
- ✅ 支持自定义反向代理地址
- ✅ 支持配置热重载
- ✅ 不影响其他网络请求

### 安装
详见 [README](https://github.com/YOUR_USERNAME/openclaw-telegram-proxy#安装)
```
6. 发布类型: `pre-release` 或 `stable`
7. 点击 "Publish release"

## 发布到 NPM

### 1. 注册 NPM 账号

如果还没有账号，访问 https://www.npmjs.com/signup

### 2. 登录

```bash
npm login
# 输入用户名、密码、邮箱验证码
```

### 3. 更新 package.json

检查 `package.json` 中的 `name` 和 `version`：

```json
{
  "name": "openclaw-telegram-proxy",
  "version": "1.0.0",
  ...
}
```

### 4. 发布

```bash
cd /Users/mr-mac/.openclaw/workspace/openclaw-telegram-proxy
npm publish
```

### 5. 验证发布

访问 https://www.npmjs.com/package/openclaw-telegram-proxy 确认发布成功

### 6. 版本更新流程

后续更新时：

```bash
# 1. 更新 package.json 版本号
npm version patch  # 1.0.0 -> 1.0.1
# 或
npm version minor  # 1.0.0 -> 1.1.0
# 或
npm version major  # 1.0.0 -> 2.0.0

# 2. 发布
npm publish

# 3. 创建 GitHub Release
# - 添加新标签
git tag v1.0.1
git push origin v1.0.1
```

## 分发给用户

### GitHub

用户可以通过以下方式安装：

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/openclaw-telegram-proxy.git ~/.openclaw/extensions/openclaw-telegram-proxy

# 或下载特定版本
wget https://github.com/YOUR_USERNAME/openclaw-telegram-proxy/archive/refs/tags/v1.0.0.tar.gz
tar -xzf v1.0.0.tar.gz
mv openclaw-telegram-proxy-1.0.0 ~/.openclaw/extensions/openclaw-telegram-proxy
```

### NPM

```bash
npm install -g openclaw-telegram-proxy
```

## 推广

- 在 OpenClaw Discord 分享
- 在 Telegram 社区分享
- 提交到 clawhub.com
- 在 Reddit/r/openclaw 分享
