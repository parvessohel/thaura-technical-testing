# Thaura AI Technical Testing

Playwright-based technical testing project for the public Thaura AI website.

## Current scope

- Functional and data correctness checks
- Full discovered public-route link checks
- Contact-form validation, unusual-input, and API response checks
- Pricing arithmetic and cross-page consistency checks
- Metadata, factual-claim, and privacy-claim checks
- Lighthouse and network-performance measurements
- k6 minimum public-read load testing
- Security headers, cookie attributes, HTTPS, and exposure checks
- Authenticated API/session testing
- Chromium, Firefox, WebKit, and mobile compatibility smoke testing

## Setup

```powershell
npm install
npx playwright install chromium firefox webkit
```

The minimum public tests do not require Gmail credentials. The k6 commands also require [k6](https://k6.io/docs/get-started/installation/) to be installed and available on `PATH`.

Authenticated Developer API tests read `THAURA_API_KEY` from the local `.env` file or the shell environment. Copy `.env.example` to `.env`, add the key locally, and never commit or print it:

```powershell
Copy-Item .env.example .env
```

## Run tests

```powershell
npm test
```

Run one focused area with:

```powershell
npx playwright test tests/site-links.spec.ts
npx playwright test tests/contact-validation.spec.ts tests/contact-input-security.spec.ts
npx playwright test tests/pricing-toggle.spec.ts tests/pricing-consistency.spec.ts
npx playwright test tests/metadata.spec.ts tests/factual-claims.spec.ts
npx playwright test tests/public-route-health.spec.ts
npx playwright test tests/network-metrics.spec.ts tests/media-optimization.spec.ts
npx playwright test tests/security-headers.spec.ts tests/sensitive-exposure.spec.ts
npx playwright test tests/authenticated-session.spec.ts tests/authenticated-api-surface.spec.ts tests/authenticated-cookie.spec.ts tests/session-behavior.spec.ts
```

Open the Playwright HTML report with:

```powershell
npm run test:report
```

The latest Playwright report is generated under `playwright-report/`. Failure traces and screenshots are generated under `test-results/`; these are local diagnostics.

## Automated authenticated login

The project can sign in to Thaura automatically using the dedicated Gmail test account. The flow opens Thaura, submits the test email, completes first-time onboarding, waits for the delayed verification email, extracts the six-digit OTP from Gmail, and saves the authenticated Playwright state.

### One-time Gmail OAuth setup

1. Enable the Gmail API in the Google Cloud project.
2. Configure the OAuth consent screen and add the dedicated Gmail account as a test user.
3. Create a **Desktop app** OAuth client and download its JSON file outside the repository.
4. Generate the local Gmail refresh token:

```powershell
node scripts/generate-gmail-token.js "C:\path\to\Thaura Gmail OTP Desktop.json"
```

Authorize the dedicated Gmail account in the browser. The script writes the OAuth values to the local `.env` file. Never commit the JSON file, `.env`, client secret, or refresh token.

### Run authenticated login

```powershell
npm run auth:login
```

The saved browser state is written to `playwright/.auth/user.json` and is ignored by Git. Authenticated tests can reuse this state with Playwright's `storageState` option.

After authentication, run the authenticated checks with:

```powershell
npx playwright test tests/authenticated-session.spec.ts tests/authenticated-api-surface.spec.ts tests/authenticated-cookie.spec.ts tests/session-behavior.spec.ts
```

### Credential lifetime and regeneration

- The OAuth client JSON remains usable until the OAuth client is deleted or revoked.
- Gmail access tokens are short-lived and are renewed automatically using the refresh token.
- Because the OAuth app is currently in Testing mode and uses Gmail access, Google may expire the refresh token after approximately seven days.
- If Gmail authorization fails or the refresh token expires, run the token-generation command again and authorize the account again.
- The Playwright browser state can expire independently. Rerun `npm run auth:login` to create a fresh state file.

The OAuth client secret used during initial setup was exposed while configuring this project. For long-term use, revoke that client in Google Cloud, create a replacement Desktop client, and regenerate the local refresh token.

## Run Lighthouse audits

Run a single page audit:

```powershell
npm run lighthouse:home
npm run lighthouse:pricing
npm run lighthouse:faq
npm run lighthouse:api
```

Run all configured key-page audits:

```powershell
npm run lighthouse:all
```

Reports are saved under the `reports/` folder as JSON. The project also supports HTML output for inspection when needed.

The `/api` audit is expected to return `401` when run anonymously, so it does not produce usable Lighthouse performance metrics. The public API documentation page used by the browser tests is `/api-platform`; audit that page separately if public API documentation performance is required.

## Generate the Task 02 report

The Markdown report is the editable source of truth. Generate the browser-friendly HTML version with:

```powershell
npm run report:task02:html
```

This generates `reports/TASK-02-BUG-REPORT.html` from `reports/TASK-02-BUG-REPORT.md`.

The Markdown report is the editable source; the HTML report is the browser-friendly submission view.

## Run minimum k6 load test

The k6 test performs a conservative public-read load check against Home, Pricing, API, and FAQ using two virtual users for 20 seconds:

```powershell
npm run load:k6:min
```

Generate the k6 summary JSON and browser-friendly HTML report in one command:

```powershell
npm run load:k6:min:report
```

This generates `reports/k6-minimum-summary.json` and `reports/k6-minimum-report.html`.

The default thresholds are fewer than 5% failed requests and a 95th-percentile response time below 3 seconds. Override the defaults with `K6_VUS`, `K6_DURATION`, and `THAURA_BASE_URL` when appropriate. This is a minimum smoke load, not a stress or capacity test.

The available Lighthouse lab evidence includes FCP, LCP, CLS, TBT, Speed Index, and root-document response time. INP/FID was not available from these lab runs and is reported as unavailable rather than inferred.

## Run browser/device compatibility smoke test

This focused matrix checks the public homepage on Chromium desktop, Firefox desktop, WebKit desktop, and Chromium mobile:

```powershell
npm run test:compatibility
```

This uses `playwright.compat.config.ts` and runs the homepage smoke test in four projects. Firefox currently has a documented loading-spinner finding in the Task 02 report; the compatibility command is intentionally allowed to expose that defect.

## Suggested interview demo

For a short demonstration, run:

```powershell
npm install
npx playwright install chromium firefox webkit
npx playwright test tests/site-links.spec.ts
npm run load:k6:min:report
npm run report:task02:html
```

For the full verification pass, noting that some commands intentionally expose documented findings such as the protected `/api` Lighthouse route and Firefox loading issue:

```powershell
npm test
npm run test:compatibility
npm run lighthouse:all
npm run load:k6:min:report
```

The full pass can take several minutes and may regenerate report files. Focused commands are better during development.

## Testing notes

- Tests target `https://thaura.ai`.
- Large-scale load and stress testing is not included; `npm run load:k6:min` provides only a bounded public-read availability check.
- Contact-form delivery requires a controlled mailbox and is currently tracked in `TESTING-TODO.md`.
- Known limitations and deferred coverage are documented in `TESTING-TODO.md` and `reports/TASK-02-BUG-REPORT.md`.
- Do not commit `.env` files, OAuth JSON files, API keys, passwords, refresh tokens, browser state, or private test data.
