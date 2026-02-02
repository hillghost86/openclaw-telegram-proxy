/**
 * Cloudflare Workers - Telegram API 反向代理
 * 用于代理 Telegram Bot API 请求，解决网络访问问题
 * 
 * 部署步骤:
 * 1. 登录 Cloudflare Dashboard
 * 2. 进入 Workers & Pages
 * 3. 创建新的 Worker
 * 4. 复制此代码到编辑器
 * 5. 保存并部署
 * 6. 获取 Worker URL，配置到 DeepForceCryptoer
 */

// 允许的请求方法
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

// 允许的请求头
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'User-Agent',
  'Accept',
  'Accept-Language',
  'Accept-Encoding',
  'Connection',
  'Cache-Control',
  'Pragma',
  'X-Requested-With'
];

// 需要移除的请求头（避免冲突）
const REMOVE_HEADERS = [
  'host',
  'cf-connecting-ip',
  'cf-ray',
  'cf-visitor',
  'x-forwarded-for',
  'x-real-ip'
];

/**
 * 处理请求
 */
async function handleRequest(request) {
  try {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // 验证请求方法
    if (!ALLOWED_METHODS.includes(request.method)) {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
          'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', ')
        }
      });
    }

    // 解析请求 URL
    const url = new URL(request.url);

    // 构建目标 URL
    const targetUrl = buildTargetUrl(url);

    // 创建新的请求
    const newRequest = createProxyRequest(request, targetUrl);

    // 发送请求
    const response = await fetch(newRequest);

    // 处理响应
    return handleResponse(response);

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

/**
 * 构建目标 URL
 */
function buildTargetUrl(url) {
  // 移除 Worker 域名部分，保留路径和查询参数
  const path = url.pathname + url.search;

  // 构建 Telegram API URL
  return `https://api.telegram.org${path}`;
}

/**
 * 创建代理请求
 */
function createProxyRequest(originalRequest, targetUrl) {
  // 创建新的请求头
  const headers = new Headers();

  // 复制允许的请求头
  for (const header of ALLOWED_HEADERS) {
    const value = originalRequest.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  // 设置必要的请求头
  headers.set('Host', 'api.telegram.org');
  headers.set('User-Agent', 'Cloudflare-Worker-Telegram-Proxy/1.0');

  // 创建请求选项
  const requestOptions = {
    method: originalRequest.method,
    headers: headers,
    redirect: 'follow'
  };

  // 对于有 body 的请求，复制 body
  if (originalRequest.method !== 'GET' && originalRequest.method !== 'HEAD') {
    requestOptions.body = originalRequest.body;
  }

  return new Request(targetUrl, requestOptions);
}

/**
 * 处理响应
 */
async function handleResponse(response) {
  // 创建新的响应头
  const headers = new Headers();

  // 复制响应头
  for (const [key, value] of response.headers.entries()) {
    // 跳过一些不需要的头
    if (!REMOVE_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  // 添加 CORS 头
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
  headers.set('Access-Control-Max-Age', '86400');

  // 添加缓存控制
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  // 创建新的响应
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

/**
 * 处理 CORS 预检请求
 */
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
      'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * 健康检查端点
 */
function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'Telegram API Proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    allowedMethods: ALLOWED_METHODS
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * 主事件处理器
 */
addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 健康检查端点
  if (url.pathname === '/health' || url.pathname === '/status') {
    event.respondWith(handleHealthCheck());
    return;
  }

  // 处理代理请求
  event.respondWith(handleRequest(event.request));
});

/**
 * 错误处理
 */
addEventListener('error', event => {
  console.error('Worker error:', event.error);
});

/**
 * 未捕获的异常处理
 */
addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
