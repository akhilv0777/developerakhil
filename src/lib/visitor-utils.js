function firstHeaderValue(headers, keys) {
  if (!headers || typeof headers !== 'object') return '';

  for (const key of keys) {
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (Array.isArray(value)) {
      const first = value.find((entry) => typeof entry === 'string' && entry.trim());
      if (first) return first.trim();
      continue;
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getClientIp(req) {
  const forwarded = firstHeaderValue(req?.headers, [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'x-cluster-client-ip',
  ]);

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const remote = req?.socket?.remoteAddress || '';
  return remote.replace(/^::ffff:/, '');
}

function parseUserAgent(userAgent) {
  const ua = userAgent || '';
  const normalized = ua.toLowerCase();

  const browserPatterns = [
    { name: 'Edge', pattern: /edg\//i },
    { name: 'Chrome', pattern: /chrome\//i },
    { name: 'Safari', pattern: /safari\//i },
    { name: 'Firefox', pattern: /firefox\//i },
    { name: 'Opera', pattern: /opr\//i },
    { name: 'Brave', pattern: /brave\//i },
    { name: 'Samsung Internet', pattern: /samsungbrowser\//i },
    { name: 'DuckDuckGo', pattern: /duckduckgo\//i },
  ];

  const osPatterns = [
    { name: 'Windows', pattern: /windows nt/i },
    { name: 'Mac OS', pattern: /mac os/i },
    { name: 'iOS', pattern: /(iphone|ipad|ipod)/i },
    { name: 'Android', pattern: /android/i },
    { name: 'Linux', pattern: /linux/i },
  ];

  const browser = browserPatterns.find(({ pattern }) => pattern.test(ua))?.name || 'Unknown';
  const os = osPatterns.find(({ pattern }) => pattern.test(ua))?.name || 'Unknown';

  let device = 'Desktop';
  if (/mobile|android|iphone|ipad|ipod/i.test(normalized)) {
    device = /tablet|ipad/i.test(normalized) ? 'Tablet' : 'Mobile';
  }

  return { browser, os, device };
}

function getVisitorMetadata(req, extra = {}) {
  const userAgent = extra.userAgent || firstHeaderValue(req?.headers, ['user-agent']) || '';
  const isBot = Boolean(extra.isBot ?? /bot|crawl|spider|slurp|preview/i.test(userAgent));
  const parsed = parseUserAgent(userAgent);

  return {
    ipAddress: extra.ipAddress || getClientIp(req),
    country: extra.country || firstHeaderValue(req?.headers, ['x-vercel-ip-country', 'cf-ipcountry']) || '',
    region: extra.region || firstHeaderValue(req?.headers, ['x-vercel-ip-country-region']) || '',
    city: extra.city || firstHeaderValue(req?.headers, ['x-vercel-ip-city']) || '',
    timezone: extra.timezone || firstHeaderValue(req?.headers, ['x-vercel-ip-timezone']) || '',
    userAgent,
    browser: extra.browser || parsed.browser,
    os: extra.os || parsed.os,
    device: extra.device || parsed.device,
    language: extra.language || firstHeaderValue(req?.headers, ['accept-language']) || '',
    referrer: extra.referrer || req?.headers?.referer || '',
    pathname: extra.pathname || '',
    hostname: extra.hostname || req?.headers?.host || '',
    screenResolution: extra.screenResolution || '',
    pageTitle: extra.pageTitle || '',
    isBot,
  };
}

module.exports = {
  getClientIp,
  parseUserAgent,
  getVisitorMetadata,
};
