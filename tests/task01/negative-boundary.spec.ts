import { expect, test } from '@playwright/test';

const authStatePath = 'playwright/.auth/user.json';

test.describe('Task 01 negative and boundary inputs', () => {
  test('Blank chat submission does not create a chat request', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();
    const chatCreateRequests: string[] = [];

    page.on('request', request => {
      if (request.method() === 'POST' && /\/api\/chats$/.test(request.url())) {
        chatCreateRequests.push(request.url());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5_000);
    const composer = page.locator('textarea:not([aria-hidden="true"])').first();
    await composer.fill('');
    await composer.press('Enter');
    await page.waitForTimeout(1_500);

    console.log(JSON.stringify({ chatCreateRequests }, null, 2));
    expect(chatCreateRequests).toEqual([]);
    await context.close();
  });

  test('Long Unicode, RTL, and script-like composer input remains client-contained', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authStatePath });
    const page = await context.newPage();
    const unusualInput = `${'TASK01_BOUNDARY_'.repeat(500)} مرحبا بالعالم שלום עולם <script>alert('xss')</script>`;

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5_000);
    const composer = page.locator('textarea:not([aria-hidden="true"])').first();
    await composer.fill(unusualInput);

    const currentValue = await composer.inputValue();
    const bodyText = await page.locator('body').innerText();

    console.log(JSON.stringify({
      inputLength: unusualInput.length,
      retainedLength: currentValue.length,
      reflectedAsVisibleText: bodyText.includes("<script>alert('xss')</script>")
    }, null, 2));

    expect(currentValue).toBe(unusualInput);
    expect(bodyText).not.toContain("<script>alert('xss')</script>");
    await context.close();
  });
});
