# Task 01: Thaura Web App Technical Testing Report

## Scope

Target: `https://thaura.ai/`

This report covers the automated Task 01 work completed on the dedicated Free-tier test account. Secrets, session tokens, OAuth credentials, and API keys are intentionally excluded.

Final automated validation: `16 passed` with `npx playwright test tests/task01`.

Test account details for reproducibility:

- Primary test account email: `shoheltqtec@gmail.com`
- Quota-isolation test email: `shoheltqtec+task01quota@gmail.com`
- Plan: Free Plan
- Login method: email OTP sent by Thaura and retrieved through the dedicated Gmail inbox
- Browser state: generated locally under `playwright/.auth/`

Passwords, OAuth client secrets, Gmail refresh tokens, Thaura session tokens, and Developer API keys are intentionally excluded.

## Coverage Status

| Area | Status | Evidence |
|---|---|---|
| Authentication and session persistence | Pass | `tests/task01/auth-session.spec.ts` |
| UI logout and session invalidation | Pass | `tests/task01/auth-session.spec.ts` |
| Concurrent authenticated contexts | Pass | `tests/task01/auth-session.spec.ts` |
| Basic chat creation and streaming response | Pass | `tests/task01/chat-behavior.spec.ts` |
| Free-tier quota observation | Partial | `tests/task01/free-tier-quota.spec.ts` |
| Upload control and safe fixture selection | Pass at UI-selection level | `tests/task01/upload-integrity.spec.ts` |
| Upload parsing/data integrity | Blocked by exhausted quota | `tests/task01/upload-integrity.spec.ts` |
| Memory and Incognito controls | Partial | `tests/task01/memory-incognito.spec.ts` |
| Developer API unauthenticated contract | Pass | `tests/task01/developer-api-contract.spec.ts` |
| Developer API authenticated boundaries | Partial | `tests/task01/developer-api-authenticated.spec.ts` |
| Negative/boundary composer inputs | Pass at client level | `tests/task01/negative-boundary.spec.ts` |
| Settings/account/billing fields | Deferred | Settings surface was not exposed as an editable form in the current UI probe |

## Verified Results

### Authentication and sessions

- Authenticated `auth/me` returned `200` for the Free account.
- Session survived navigation to Pricing.
- Two independent authenticated browser contexts worked concurrently.
- Clearing one context's cookies returned `401` without invalidating the other context.
- UI Logout returned the session to `401 Not authenticated`.
- UI logout uses a temporary fresh OTP session so it does not invalidate the shared state used by the other tests.

### Chat behavior

- Chat creation request returned `201`.
- `POST /v1/chat/completions` returned `200` with streaming enabled.
- The assistant response rendered in the conversation.
- Prompt and response markers were observed in the UI.

### Free-tier quota

The test account was already exhausted before a fresh #5/#6 boundary run. Thaura displayed:

```text
Out of messages
Free accounts get 5 messages every 5 hours
Free messages reset in: approximately 5 hours
```

This conflicts with the assignment wording of `5 messages / 2 hours`. Exact fresh message #5/#6 enforcement and reset behavior remain blocked without a genuinely fresh quota bucket.

### Upload controls

Safe local fixtures were created for PDF, CSV, SVG, corrupted PDF, and empty text. The authenticated upload control accepted document/image fixture selection and rendered attachment chips. Assistant-side parsing accuracy, oversized/password-protected behavior, and cross-account isolation require an available message quota and additional controlled accounts.

### Memory and Incognito

- Memory panel opened successfully.
- Empty Memory state was observable.
- Incognito control was visible and activatable.
- Cross-chat memory persistence could not be verified because the account quota was exhausted before a new fact could be sent.
- Client-side automation cannot prove deletion from server backups or internal storage.

### Developer API

Safe runtime checks verified:

- Missing/invalid authentication: `401`.
- Valid key with zero balance: `402 Insufficient balance`.
- Invalid model: `400 invalid_model`.
- Invalid messages type: `400`.
- Legacy `functions` and `function_call`: `400 unsupported_parameter`.

The live documentation was also checked for parameter limits, precedence, ignored parameters, schemas, usage fields, and rate-limit claims. Successful funded inference, streaming response content, usage accounting, precedence behavior, and actual `429` behavior remain blocked by zero balance and metering risk.

### Negative and boundary inputs

- Blank chat submission created no chat request.
- An 8,054-character prompt containing Unicode, RTL text, and script-like text remained client-contained.
- Script-like text was not reflected as visible page content.

## Remaining Limitations

1. A fresh quota bucket was unavailable, so exact message #5/#6 and two-hour reset behavior could not be verified.
2. The product currently displays a five-hour reset window, conflicting with the task's two-hour wording.
3. Upload parsing accuracy and data-isolation testing require quota and separate controlled accounts.
4. Memory persistence versus Incognito leakage requires at least one successful memory-setting conversation.
5. Funded Developer API inference, streaming/usage validation, and rate-limit behavior require balance and controlled metered testing.
6. Settings/account/billing negative testing was deferred because editable controls were not exposed in the current UI probe.

## Reproduction Commands

```powershell
npx playwright test tests/task01/auth-session.spec.ts
npx playwright test tests/task01/chat-behavior.spec.ts
npx playwright test tests/task01/free-tier-quota.spec.ts
npx playwright test tests/task01/upload-integrity.spec.ts
npx playwright test tests/task01/memory-incognito.spec.ts
npx playwright test tests/task01/developer-api-contract.spec.ts
npx playwright test tests/task01/developer-api-authenticated.spec.ts
npx playwright test tests/task01/negative-boundary.spec.ts
npx playwright test tests/task01
```
