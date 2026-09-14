# Thaura AI Technical Testing

Playwright-based technical testing project for the public Thaura AI website.

## Current scope

- Functional and data correctness checks
- Pricing and FAQ consistency checks
- Contact-form validation checks
- Home-page link checks
- Browser console and HTTP error observation

## Setup

```powershell
npm install
npx playwright install chromium
```

## Run tests

```powershell
npm test
```

Open the Playwright HTML report with:

```powershell
npm run test:report
```

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

Run all key-page audits:

```powershell
npm run lighthouse:all
```

Reports are saved under the `reports/` folder as JSON. The project also supports HTML output for inspection when needed.

## Run bounded load smoke test

This is a small, non-intrusive concurrent check for the key public pages. It is not a stress test.

```powershell
npm run load:smoke
```

Defaults are five concurrent requests and two iterations. Override them when needed with `LOAD_CONCURRENCY` and `LOAD_ITERATIONS`.

## Run browser/device compatibility smoke test

This focused matrix checks the public homepage on Chromium desktop, Firefox desktop, WebKit desktop, and Chromium mobile:

```powershell
npm run test:compatibility
```

## Testing notes

- Tests target `https://thaura.ai`.
- Large-scale load and stress testing is not included; `npm run load:smoke` provides only a bounded availability check.
- Contact-form delivery requires a controlled mailbox and is currently tracked in `TESTING-TODO.md`.
- Do not commit `.env` files, OAuth JSON files, API keys, passwords, refresh tokens, browser state, or private test data.
