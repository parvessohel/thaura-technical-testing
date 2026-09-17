# Task 01: Thaura Web App Technical Testing Report

## Scope

Target: `https://thaura.ai/`

This report covers the automated Task 01 work completed on the dedicated Free-tier test account. Secrets, session tokens, OAuth credentials, and API keys are intentionally excluded.

Final automated validation: `18 passed` with `npx playwright test tests/task01`.

Test account details for reproducibility:

- Primary test account email: `shoheltqtec@gmail.com`
- Quota-isolation test email: `shoheltqtec+task01quota@gmail.com`
- Chat-behavior test email: `shoheltqtec+task01chat@gmail.com`
- Upload-parsing test email: `shoheltqtec+task01upload@gmail.com`
- Quota-bypass test email: `shoheltqtec+task01bypass@gmail.com`
- Quota-window test email: `shoheltqtec+task01window@gmail.com`
- Quota-error test email: `shoheltqtec+task01quotaerr@gmail.com`
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
| Free-tier quota observation | Pass | `tests/task01/free-tier-quota.spec.ts` |
| Free-tier quota bypass resistance (multi-tab, refresh, direct API) | Pass | `tests/task01/quota-bypass.spec.ts` |
| Free-tier quota window behavior (rolling vs. fixed, reset anchor) | Pass | `tests/task01/quota-window-behavior.spec.ts` |
| Failed/errored request quota consumption | Pass | `tests/task01/quota-failed-response.spec.ts` |
| Upload control and safe fixture selection | Pass at UI-selection level | `tests/task01/upload-integrity.spec.ts` |
| Upload parsing/data integrity (PDF content read back accurately) | Pass | `tests/task01/upload-parsing-accuracy.spec.ts` |
| Upload data isolation across accounts, password-protected/oversized handling | Not tested | See Remaining Limitations |
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

A fresh quota bucket was obtained using the dedicated quota-isolation account (`shoheltqtec+task01quota@gmail.com`) on 2026-09-17. Six sequential prompts were sent and observed exactly at the boundary:

- Messages 1 through 5 (`Q1`-`Q5`) each returned `200` and rendered an assistant response.
- Message 6 (`Q6`) returned no completion response and the UI displayed the quota-block state instead.

```text
Out of messages. Here's the honest ask.
Free accounts get 5 messages every 5 hours.
Free messages reset in: 4h 59m
```

This confirms the product enforces the limit exactly after the 5th message, and independently reconfirms the product's stated window is `5 messages every 5 hours`, not the assignment's `5 messages / 2 hours`.

### Upload controls

Safe local fixtures were created for PDF, CSV, SVG, corrupted PDF, and empty text. The authenticated upload control accepted document/image fixture selection and rendered attachment chips.

A fresh dedicated account (`shoheltqtec+task01upload@gmail.com`) was used to verify actual parsing accuracy, not just UI acceptance: `known.pdf` (containing the text `TASK01 PDF MARKER`) was attached and the assistant was asked to read back the exact marker text. The response correctly returned `TASK01 PDF MARKER`, confirming the assistant genuinely extracts and reads document content rather than only acknowledging the attachment.

Oversized files, password-protected files, and cross-account upload data isolation were not tested; no fixtures for those cases were created and no second-account cross-read attempt was made.

### Quota bypass resistance

A third fresh dedicated account (`shoheltqtec+task01bypass@gmail.com`) was used to test whether the Free-tier limit can be circumvented, per the assignment's named bypass vectors:

- **Multiple tabs:** after the account was quota-blocked in one browser context, a second browser context/tab sharing the same authenticated session was also blocked; no additional message was accepted through the second tab.
- **Session refresh:** reloading the page in the original tab did not reset or clear the block; the next message attempt was still rejected.
- **Direct API call:** the exact request payload the UI itself had sent to `POST /v1/chat/completions` was replayed directly via an authenticated HTTP request (bypassing the composer/UI entirely). The backend returned `429 rate_limit_exceeded` ("Free users can send 5 messages every 5 hours") with a `resetAt` timestamp, rather than succeeding.

All three named bypass vectors were blocked; the quota is enforced account-wide at the backend, not just cosmetically in the UI.

### Quota window behavior (rolling vs. fixed)

A fourth fresh dedicated account (`shoheltqtec+task01window@gmail.com`) was used to determine whether the 5-message window is rolling (extends with each new message) or fixed (anchored to a single point in time). Five messages were sent with recorded timestamps, then a direct API call captured the `429` block response, which included a `resetAt` timestamp.

- First message sent: `2026-09-17T15:32:31.390Z`; last (5th) message sent: `2026-09-17T15:33:18.496Z`.
- `resetAt` returned by the backend: `2026-09-17T20:32:52.923Z`.
- `resetAt` is `21.5` seconds from `firstMessageTime + 5 hours`, versus `25.6` seconds from `lastMessageTime + 5 hours`.

Both differences are small, but the reset time is measurably closer to (and consistent with) `first message + 5 hours`. This indicates the window is anchored to the oldest message in the current 5-message bucket (a fixed/sliding-window-log style limiter), not one that resets or extends from the most recent activity.

### Failed/errored request quota consumption

A fifth fresh dedicated account (`shoheltqtec+task01quotaerr@gmail.com`) was used to test whether an errored request still consumes a quota slot. A deliberately malformed request (`messages` sent as a string instead of an array) was sent directly to the completions endpoint first, returning `400 invalid_messages`. Five legitimate messages were then sent through the UI, and all five succeeded (rendered assistant markers `E1`-`E5`) without triggering a quota block.

This confirms the malformed/errored request did **not** consume one of the 5 allowed messages; only successfully-processed messages count against the Free-tier quota.

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

1. Password-protected and oversized upload files were not tested; no fixtures were created for those cases.
2. Cross-account upload data isolation was not tested.
3. Memory persistence versus Incognito leakage requires at least one successful memory-setting conversation; the primary test account's quota was exhausted by other test activity before this could be sent.
4. Funded Developer API inference, streaming/usage validation, and rate-limit behavior require balance and controlled metered testing.
5. Settings/account/billing negative testing was deferred because editable controls were not exposed in the current UI probe.
6. An initial 2026-09-17 measurement showed the homepage (`/`) taking 30-42+ seconds to render content; a retest after disabling a local VPN connection dropped this to 5-17 seconds, so the severe original measurement is most likely a local network artifact rather than a product defect (see Task 02 report F-006 for the corrected finding). The login script's element-wait timeout was kept at 90s as a resilience margin regardless.

## Reproduction Commands

```powershell
npx playwright test tests/task01/auth-session.spec.ts
npx playwright test tests/task01/chat-behavior.spec.ts
npx playwright test tests/task01/free-tier-quota.spec.ts
npx playwright test tests/task01/quota-bypass.spec.ts
npx playwright test tests/task01/quota-window-behavior.spec.ts
npx playwright test tests/task01/quota-failed-response.spec.ts
npx playwright test tests/task01/upload-integrity.spec.ts
npx playwright test tests/task01/upload-parsing-accuracy.spec.ts
npx playwright test tests/task01/memory-incognito.spec.ts
npx playwright test tests/task01/developer-api-contract.spec.ts
npx playwright test tests/task01/developer-api-authenticated.spec.ts
npx playwright test tests/task01/negative-boundary.spec.ts
npx playwright test tests/task01
```
