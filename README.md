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
npx playwright test
```

Open the HTML report with:

```powershell
npx playwright show-report
```

## Testing notes

- Tests target `https://thaura.ai`.
- Load testing is not included in the current minimum phase.
- Contact-form delivery requires a controlled mailbox and is currently tracked in `TESTING-TODO.md`.
- Do not commit `.env` files, API keys, passwords, or private test data.
