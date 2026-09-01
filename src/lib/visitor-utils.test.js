const test = require('node:test');
const assert = require('node:assert/strict');
const { getClientIp, parseUserAgent } = require('./visitor-utils.js');

test('getClientIp prefers the first forwarded value', () => {
  const req = {
    headers: {
      'x-forwarded-for': '203.0.113.10, 198.51.100.5',
    },
    socket: { remoteAddress: '127.0.0.1' },
  };

  assert.equal(getClientIp(req), '203.0.113.10');
});

test('parseUserAgent identifies browser and operating system', () => {
  const result = parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

  assert.equal(result.browser, 'Chrome');
  assert.equal(result.os, 'Windows');
  assert.equal(result.device, 'Desktop');
});
