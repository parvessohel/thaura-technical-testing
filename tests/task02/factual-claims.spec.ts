import { expect, test } from '@playwright/test';

const pagesToInspect = ['/', '/story', '/constitution', '/api-platform', '/faq', '/privacy-policy', '/terms-of-service'];
const claimPattern = /parameter|billion|million|energy|token|language|encryption|AES|GDPR|EU|Europe|residen|data|privacy|trained|training|security/i;

test('Extract stated technical and privacy claims for consistency review', async ({ page }) => {
  const claimEvidence: Array<{ path: string; statements: string[] }> = [];

  for (const path of pagesToInspect) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(response?.status(), `${path} should load`).toBe(200);
    await page.waitForTimeout(2_000);

    const text = await page.locator('body').innerText();
    const statements = text
      .split(/\n+/)
      .map(line => line.replace(/\s+/g, ' ').trim())
      .filter(line => line.length > 0 && claimPattern.test(line));

    claimEvidence.push({
      path,
      statements: [...new Set(statements)]
    });
  }

  console.log(JSON.stringify({ pagesToInspect, claimEvidence }, null, 2));
  expect(claimEvidence).toHaveLength(pagesToInspect.length);
});

test('Repeated technical and privacy claims remain consistent across legal pages', async ({ page }) => {
  const pageText = new Map<string, string>();

  for (const path of ['/privacy-policy', '/terms-of-service', '/api-platform']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(response?.status(), `${path} should load`).toBe(200);
    pageText.set(path, (await page.locator('body').innerText()).replace(/\s+/g, ' '));
  }

  const privacy = pageText.get('/privacy-policy') ?? '';
  const terms = pageText.get('/terms-of-service') ?? '';
  const api = pageText.get('/api-platform') ?? '';

  const evidence = {
    encryption: {
      privacyAes: /AES-256-GCM/i.test(privacy),
      termsAes: /AES-256-GCM/i.test(terms),
      privacyTls: /TLS 1\.2\+/i.test(privacy),
      termsTls: /TLS 1\.2 or higher/i.test(terms)
    },
    privacyAndResidency: {
      privacyGdpr: /GDPR/i.test(privacy),
      termsGdpr: /GDPR/i.test(terms),
      privacyEuSafeguards: /outside the EU only under approved safeguards/i.test(privacy),
      termsEuInfrastructure: /within the European Union/i.test(terms)
    },
    modelAndLanguage: {
      termsModel: terms.match(/underlying model is currently [^,]+/i)?.[0] ?? null,
      termsLanguages: terms.match(/available in more than \d+ languages/i)?.[0] ?? null
    },
    apiPricing: {
      termsInputPrice: terms.match(/\$?0\.50 US dollars per million input tokens/i)?.[0] ?? null,
      termsOutputPrice: terms.match(/\$?2\.00 US dollars per million output tokens/i)?.[0] ?? null,
      apiMentionsPricing: /pricing|per million input tokens|per million output tokens/i.test(api)
    }
  };

  console.log(JSON.stringify(evidence, null, 2));

  expect(evidence.encryption.privacyAes && evidence.encryption.termsAes).toBe(true);
  expect(evidence.encryption.privacyTls && evidence.encryption.termsTls).toBe(true);
  expect(evidence.privacyAndResidency.privacyGdpr && evidence.privacyAndResidency.termsGdpr).toBe(true);
  expect(evidence.modelAndLanguage.termsModel).toContain('Qwen3.8');
  expect(evidence.modelAndLanguage.termsLanguages).toBe('available in more than 90 languages');
  expect(evidence.apiPricing.termsInputPrice).not.toBeNull();
  expect(evidence.apiPricing.termsOutputPrice).not.toBeNull();
});
