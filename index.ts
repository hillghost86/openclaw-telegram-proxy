import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const DEBUG = process.env.OPENCLAW_TELEGRAM_PROXY_DEBUG === "1" || process.env.OPENCLAW_TELEGRAM_PROXY_DEBUG === "true";

// Original fetch that we'll restore when needed
let originalFetch: typeof fetch = fetch;

// Configuration state
let proxyUrl: string | null = null;

function logDebug(api: OpenClawPluginApi, msg: string) {
  if (DEBUG && api.logger.debug) {
    api.logger.debug(`[openclaw-telegram-proxy] ${msg}`);
  }
}

/**
 * Replace Telegram API base URL in a request URL
 */
function replaceTelegramApiUrl(url: string): string {
  if (!proxyUrl) {
    return url;
  }
  const base = proxyUrl.replace(/\/$/, "");
  return url.replace("https://api.telegram.org", base);
}

/**
 * Intercept fetch to replace Telegram API calls
 */
async function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlString: string;
  if (typeof input === "string") {
    urlString = input;
  } else if (input instanceof URL) {
    urlString = input.toString();
  } else if (input instanceof Request) {
    urlString = input.url;
  } else {
    urlString = String(input);
  }

  if (urlString.includes("api.telegram.org")) {
    const replacedUrl = replaceTelegramApiUrl(urlString);
    if (DEBUG && typeof console !== "undefined" && console.debug) {
      console.debug("[openclaw-telegram-proxy] proxying:", urlString, "->", replacedUrl);
    }

    if (typeof input === "string" || input instanceof URL) {
      return originalFetch(replacedUrl as RequestInfo, init);
    }

    if (input instanceof Request) {
      const replacedRequest = new Request(replacedUrl, input);
      return originalFetch(replacedRequest, init);
    }
  }

  return originalFetch(input, init);
}

/**
 * Apply the fetch proxy
 */
function applyFetchProxy() {
  if (proxyUrl) {
    // @ts-ignore - we're intentionally replacing global fetch
    globalThis.fetch = proxiedFetch;
  }
}

/**
 * Remove the fetch proxy and restore original
 */
function removeFetchProxy() {
  // @ts-ignore - restoring original fetch
  globalThis.fetch = originalFetch;
}

/**
 * Read proxyUrl from plugin config
 */
function getProxyUrl(pluginConfig: unknown): string | null {
  if (!pluginConfig || typeof pluginConfig !== "object") {
    return null;
  }
  const config = pluginConfig as Record<string, unknown>;
  if (typeof config.proxyUrl === "string") {
    return config.proxyUrl.trim() || null;
  }
  return null;
}

const plugin = {
  id: "openclaw-telegram-proxy",
  name: "OpenClaw Telegram Proxy",
  description: "Replace api.telegram.org with custom proxy for Telegram API access in restricted regions",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      proxyUrl: {
        type: "string",
        description: "Telegram API proxy URL (e.g., https://tgapi.yourdomain.com)",
        default: "",
      },
    },
  },
  register(api: OpenClawPluginApi) {
    api.logger.info?.("[openclaw-telegram-proxy] 插件注册成功");

    // Prefer api.pluginConfig (passed by loader); fallback to full config path
    const pluginConfig =
      api.pluginConfig ??
      (api.config.plugins?.entries?.["openclaw-telegram-proxy"] as Record<string, unknown> | undefined)
        ?.config;

    logDebug(api, `pluginConfig: ${JSON.stringify(pluginConfig)}`);
    logDebug(api, `plugins.entries keys: ${api.config.plugins?.entries ? Object.keys(api.config.plugins.entries).join(",") : ""}`);

    const url = pluginConfig ? getProxyUrl(pluginConfig) : null;

    if (url) {
      proxyUrl = url.replace(/\/$/, "");
      applyFetchProxy();
      api.logger.info?.(`[openclaw-telegram-proxy] Applied proxy: ${proxyUrl}`);

      // Warn if channels.telegram.proxy is also set - it takes precedence over global fetch
      const tgProxy = (api.config.channels as Record<string, unknown>)?.telegram as
        | { accounts?: Record<string, { proxy?: string }> }
        | undefined;
      const hasTgProxy = tgProxy?.accounts && Object.values(tgProxy.accounts).some((a) => a?.proxy);
      if (hasTgProxy) {
        api.logger.warn?.(
          "[openclaw-telegram-proxy] channels.telegram.accounts[].proxy is set. That SOCKS/HTTP proxy takes precedence; this plugin may not apply to Telegram. Remove proxy from channels.telegram if you want URL replacement (reverse proxy) instead.",
        );
      }
      logDebug(api, "globalThis.fetch replaced, originalFetch preserved");
    } else {
      proxyUrl = null;
      api.logger.info?.(
        "[openclaw-telegram-proxy] No proxyUrl configured (proxyUrl empty or missing). Telegram will use direct connection. " +
          "If in restricted region, add proxyUrl to plugins.entries.openclaw-telegram-proxy.config in openclaw.json.",
      );
    }

    // Hook: log when gateway starts (confirms plugin runs before channels)
    api.on?.("gateway_start", () => {
      api.logger.info?.(
        `[openclaw-telegram-proxy] gateway_start: proxyUrl=${proxyUrl ?? "(none)"}, fetchReplaced=${globalThis.fetch === proxiedFetch}`,
      );
    });
  },
};

export default plugin;
