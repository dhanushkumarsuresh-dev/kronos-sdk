const SENSITIVE_HEADER_KEYS = new Set(['x-api-key', 'x-user-key', 'authorization', 'token']);
const SENSITIVE_QUERY_KEYS = ['token', 'apikey', 'api_key', 'apiKey'];

function maskValue(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= 4) return '***';
  return `***${value.slice(-4)}`;
}

function maskHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = SENSITIVE_HEADER_KEYS.has(k.toLowerCase()) ? maskValue(String(v)) : v;
  }
  return out;
}

export function maskUrl(url) {
  try {
    const u = new URL(url);
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (u.searchParams.has(key)) {
        u.searchParams.set(key, maskValue(u.searchParams.get(key)));
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text?.length > 500 ? `${text.slice(0, 500)}…` : text;
  }
}

export function createLogger({ verbose = true } = {}) {
  const entries = [];

  async function loggedFetch(url, init = {}) {
    const start = Date.now();
    const method = (init.method || 'GET').toUpperCase();
    const entry = {
      ts: new Date().toISOString(),
      method,
      url: maskUrl(url),
      requestHeaders: maskHeaders(init.headers || {}),
      requestBody: verbose ? init.body || null : init.body ? '[omitted]' : null,
      status: 0,
      ok: false,
      latencyMs: 0,
      responseBody: null,
      error: null,
    };
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      entry.status = res.status;
      entry.ok = res.ok;
      entry.latencyMs = Date.now() - start;
      entry.responseBody = verbose ? safeJson(text) : `[${text.length} bytes]`;
      entries.push(entry);
      // Re-create a Response so callers can keep using .json()/.text() naturally
      return new Response(text, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    } catch (err) {
      entry.latencyMs = Date.now() - start;
      entry.error = err?.message || String(err);
      entries.push(entry);
      throw err;
    }
  }

  return { fetch: loggedFetch, entries };
}
