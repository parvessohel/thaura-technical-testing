import { expect, test } from '@playwright/test';

const keyPages = ['/', '/pricing', '/api-platform', '/faq'];
const secretPatterns = [
  /-----BEGIN (?:RSA|OPENSSH|EC|DSA)? ?PRIVATE KEY-----/i,
  /(?:sk|pk)-[a-zA-Z0-9]{20,}/,
  /gh[pousr]_[a-zA-Z0-9_]{20,}/,
  /xox[baprs]-[a-zA-Z0-9-]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /(?:client_secret|refresh_token|access_token)\s*[:=]/i
];
const stackTracePattern = /(Traceback \(most recent call last\)|UnhandledPromiseRejection|(?:^|\n)(?:Error|TypeError|ReferenceError|SyntaxError):[^\n]{1,200}\n\s+at\s+[^\n]{1,200})/i;

function findMatches(text: string, pattern: RegExp) {
  return pattern.test(text) ? text.slice(0, 500) : null;
}

test('Key public pages do not expose credential-shaped secrets or stack traces', async ({ page }) => {
  test.setTimeout(120_000);
  const findings: Array<{ path: string; location: string; type: string; sample: string }> = [];

  for (const path of keyPages) {
    const consoleMessages: string[] = [];
    const responseBodies: string[] = [];
    page.removeAllListeners('console');
    page.removeAllListeners('response');
    page.on('console', message => consoleMessages.push(message.text()));
    page.on('response', async response => {
      const contentType = response.headers()['content-type'] || '';
      if (!contentType.includes('text') && !contentType.includes('javascript') && !contentType.includes('json')) return;
      try {
        responseBodies.push(await response.text());
      } catch {
        // A response may be unavailable after navigation; source exposure is still checked below.
      }
    });

    await page.goto(path, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(1_000);

    const pageSource = await page.content();
    const sources = [
      { location: 'page source', text: pageSource },
      ...consoleMessages.map(text => ({ location: 'console', text })),
      ...responseBodies.map(text => ({ location: 'response body', text }))
    ];

    for (const source of sources) {
      for (const pattern of secretPatterns) {
        const sample = findMatches(source.text, pattern);
        if (sample) findings.push({ path, location: source.location, type: 'credential-shaped value', sample });
      }

      const stackSample = source.location === 'console'
        ? findMatches(source.text, stackTracePattern)
        : null;
      if (stackSample) findings.push({ path, location: source.location, type: 'stack trace', sample: stackSample });
    }
  }

  console.log(JSON.stringify({ keyPages, findings }, null, 2));
  expect(findings, 'Public pages should not expose credential-shaped secrets or stack traces').toEqual([]);
});
