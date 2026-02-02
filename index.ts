import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

// Original fetch that we'll restore when needed
let originalFetch: typeof fetch = fetch;

// Configuration state
let proxyUrl: string | null = null;

/**
 * Replace Telegram API base URL in a request URL
 */
function replaceTelegramApiUrl(url: string): string {
  if (!proxyUrl) {
    return url;
  }

  // Match api.telegram.org and replace with proxy URL
  return url.replace("https://api.telegram.org", proxyUrl);
}

/**
 * Intercept fetch to replace Telegram API calls
 */
async function proxiedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Extract URL from input
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

  // Check if this is a Telegram API call
  if (urlString.includes("api.telegram.org")) {
    // Replace the URL
    const replacedUrl = replaceTelegramApiUrl(urlString);

    // If input is a string or URL, pass the replaced URL
    if (typeof input === "string" || input instanceof URL) {
      return originalFetch(replacedUrl as RequestInfo, init);
    }

    // If input is a Request object, we need to clone it with the new URL
    if (input instanceof Request) {
      const replacedRequest = new Request(replacedUrl, input);
      return originalFetch(replacedRequest, init);
    }
  }

  // Not a Telegram API call, use original fetch
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
 * Read plugin config from OpenClaw config
 */
function getProxyUrl(pluginConfig: unknown): string | null {
  if (!pluginConfig || typeof pluginConfig !== "object") {
    return null;
  }

  const config = pluginConfig as Record<string, unknown>;
  
  if (typeof config.proxyUrl === "string") {
    return config.proxyUrl.trim();
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
        description: "Telegram API proxy URL (e.g., https://tgapi.dfcer.com)",
        default: "",
      },
    },
  },
  register(api: OpenClawPluginApi) {
    // Get plugin config from full config
    const fullConfig = api.config;
    
    // The plugin config is stored in plugins.entries.openclaw-telegram-proxy.config
    const pluginConfig = (fullConfig.plugins?.entries?.["openclaw-telegram-proxy"] as Record<string, unknown>)?.config;
    
    if (pluginConfig) {
      const url = getProxyUrl(pluginConfig);
      if (url) {
        proxyUrl = url;
        applyFetchProxy();
        api.logger.info?.(
          `[openclaw-telegram-proxy] Applied proxy: ${url.replace(/\/$/, "")}`,
        );
      } else {
        api.logger.info?.(
          `[openclaw-telegram-proxy] No proxy URL configured, using direct connection`,
        );
      }
    } else {
      api.logger.info?.(
        `[openclaw-telegram-proxy] No plugin config found, using direct connection`,
      );
    }
  },
};

export default plugin;
