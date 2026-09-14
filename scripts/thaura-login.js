const path = require('path');
const { chromium } = require('@playwright/test');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { fetchLatestOtpCode } = require('./gmail-otp');

async function selectorExists(page, selectors) {
    for (const selector of selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) return selector;
    }
    return null;
}

async function clickFirst(page, selectors) {
    const found = await selectorExists(page, selectors);
    if (!found) return false;
    await page.locator(found).first().click();
    return true;
}

async function waitForOtp(email, after, attempts = 12, delayMs = 5_000) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await fetchLatestOtpCode({ account: email, searchTerms: 'Thaura', maxAgeDays: 1, after });
        } catch (error) {
            if (attempt === attempts) throw error;
            console.log(`OTP not available yet; retrying in ${delayMs / 1000}s (${attempt}/${attempts - 1})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}

async function loginViaOtp({
    email = process.env.THAURA_EMAIL || process.env.GMAIL_ACCOUNT,
    loginUrl = process.env.THAURA_LOGIN_URL || 'https://thaura.ai',
    headless = true,
    saveStatePath = path.resolve(__dirname, '..', 'playwright', '.auth', 'user.json')
} = {}) {
    if (!email) {
        throw new Error('THAURA_EMAIL or GMAIL_ACCOUNT is required in .env to automate the OTP sign-in flow.');
    }

    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
        await page.waitForTimeout(3_000);

        if (await page.getByRole('heading', { name: /Late night session, .+\?/ }).count()) {
            require('fs').mkdirSync(path.dirname(saveStatePath), { recursive: true });
            await context.storageState({ path: saveStatePath });
            console.log(`Existing authenticated session saved to ${saveStatePath}.`);
            return { page, context, saveStatePath };
        }

        const emailSelector = 'input[type="email"], input[name*="email" i], input[autocomplete="email"], input[placeholder*="email" i]';

        const emailInput = page.locator(emailSelector).first();
        if (!(await emailInput.count())) {
            const tryControl = page.locator('button, a').filter({ hasText: /Try Thaura/i }).first();
            await tryControl.waitFor({ state: 'visible', timeout: 20_000 });
            await tryControl.click({ force: true });
            await page.waitForTimeout(1_000);
        }

        await page.locator(emailSelector).first().fill(email);
        const requestedAt = new Date();
        await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click({ force: true });
        await page.waitForTimeout(1_500);

        const nameInput = page.locator('input[placeholder="Enter your name"]');
        if (await nameInput.count()) {
            await nameInput.fill(process.env.THAURA_NAME || 'Thaura Test');
            await page.getByRole('dialog').getByRole('button', { name: 'Continue' }).click({ force: true });
        }

        const verificationHeading = page.getByText('Check your email', { exact: true }).last();
        try {
            await verificationHeading.waitFor({ state: 'visible', timeout: 30_000 });
        } catch (error) {
            console.log(`Thaura post-submit state: ${(await page.locator('body').innerText()).slice(-1200)}`);
            throw error;
        }

        const otp = await waitForOtp(email, requestedAt);
        console.log(`Using OTP code: ${otp}`);

        await page.locator('input:not([type="file"])').last().fill(otp);

        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => { });
        await page.waitForTimeout(5_000);

        const statePath = path.dirname(saveStatePath);
        require('fs').mkdirSync(statePath, { recursive: true });
        await context.storageState({ path: saveStatePath });

        const pageTitle = await page.title();
        console.log(`Authenticated session saved to ${saveStatePath}. Current page title: ${pageTitle}`);
        return { page, context, saveStatePath };
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    loginViaOtp()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error.message || error);
            process.exit(1);
        });
}

module.exports = { loginViaOtp };
