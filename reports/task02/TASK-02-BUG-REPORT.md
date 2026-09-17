# Task 02: Thaura.ai Website Technical Testing Report

## 1. Executive Summary

Target: `https://thaura.ai/`

The minimum technical testing pass is substantially complete across functional correctness, performance baseline, security baseline, and browser/device compatibility. The most important confirmed defect is a customer-facing pricing inconsistency:

- Pricing page: `$12/month`, `Billed $144/year`, `Save 20%`
- `$12 x 12 = $144`, which represents a `0%` annual discount.
- The FAQ still references `$15/month`.
- `$15 x 12 = $180`; `$144` is a 20% discount from `$180`.

The contact form accepts and submits data successfully at the API/UI level, and delivery is now confirmed: a manual submission received a reply from `info@thaura.ai` quoting the exact submitted Name, Email, Subject, and Message, verifying accurate end-to-end delivery. The observed reply took roughly 44 hours, longer than the page's stated 24-hour response commitment.

## 2. Scope and Environment

- Target: `https://thaura.ai/`
- Browser automation: Playwright with Chromium, Firefox, WebKit, and Chromium mobile smoke coverage
- Performance: Lighthouse 12.8.2 and k6 2.1.0
- Load test: 2 virtual users for 20 seconds, public GET requests only
- Authenticated account: dedicated Gmail-backed Thaura test account
- Reports and raw evidence: `reports/`, `tests/`, and `TESTING-TODO.md`

For link coverage, the test enumerated every rendered `<a href>` value on all 14
listed public routes, including same-origin and external HTTP(S) destinations.
HTTP links were classified as mixed content, and each HTTP(S) destination was
requested to verify that it resolved without a 4xx/5xx response. Links that are
only created after an untested interaction or loaded exclusively by client-side
code without a rendered anchor are outside this automated enumeration scope.

## 3. Requirement Coverage Matrix

| Task 02 requirement | Status | Evidence |
|---|---|---|
| Internal and external links resolve | Pass for all rendered HTTP(S) links on the 14 tested public routes | [site-links.spec.ts](../../tests/task02/site-links.spec.ts) |
| Contact required fields and email validation | Pass | [contact-validation.spec.ts](../../tests/task02/contact-validation.spec.ts) |
| Contact success/API response | Pass at submission level | [contact-submission.spec.ts](../../tests/task02/contact-submission.spec.ts) |
| Contact data receipt/delivery | Pass (confirmed) | [TESTING-TODO.md](../TESTING-TODO.md) |
| Contact length limits | Finding | [contact-input-security.spec.ts](../../tests/task02/contact-input-security.spec.ts) |
| Pricing calculation and cross-page consistency | Fail | [pricing-consistency.spec.ts](../../tests/task02/pricing-consistency.spec.ts) |
| Canonical, meta, Open Graph, and Twitter metadata | Pass for key pages | [metadata.spec.ts](../../tests/task02/metadata.spec.ts) |
| Factual and technical claim consistency | Partial | [factual-claims.spec.ts](../../tests/task02/factual-claims.spec.ts) |
| Lighthouse key-page audits | Partial: public pages covered; `/api` is protected | `reports/task02/lighthouse-*.json` |
| Minimum concurrent load testing | Pass | [k6-minimum.js](../load/k6-minimum.js) and [k6-minimum-report.html](k6-minimum-report.html) |
| Media optimization inspection | Pass with limitations | [media-optimization.spec.ts](../../tests/task02/media-optimization.spec.ts) |
| Page weight and request counts | Pass for key pages | [network-metrics.spec.ts](../../tests/task02/network-metrics.spec.ts) |
| Console and failed-network monitoring | Pass for public routes | [public-route-health.spec.ts](../../tests/task02/public-route-health.spec.ts) |
| HTTPS and mixed-content checks | Pass | [security-headers.spec.ts](../../tests/task02/security-headers.spec.ts) |
| Security headers | Pass for checked pages | [security-headers.spec.ts](../../tests/task02/security-headers.spec.ts) |
| Unusual/special-character input | Pass for Contact form | [contact-input-security.spec.ts](../../tests/task02/contact-input-security.spec.ts) |
| Sensitive-information exposure | No findings in tested public pages | [sensitive-exposure.spec.ts](../../tests/task02/sensitive-exposure.spec.ts) |
| Cookie attributes | Pass for authenticated session cookie | [authenticated-cookie.spec.ts](../../tests/task02/authenticated-cookie.spec.ts) |
| Cross-browser/device compatibility | Partial: Firefox render failure | [compatibility.spec.ts](../../tests/task02/compatibility.spec.ts) |

## 4. Confirmed Findings

### F-001: Pricing discount calculation is inconsistent

- Severity: Medium
- Area: Functional and data correctness
- URL: `https://thaura.ai/pricing`
- Reproduction:
  1. Open the Pricing page.
  2. Select the Annual option.
  3. Observe `$12/month`, `Billed $144/year`, and `Save 20%`.
  4. Calculate `$12 x 12`.
- Expected: The displayed annual price and saving percentage should be mathematically consistent.
- Actual: `$12 x 12 = $144`, so the annual price is not discounted. The displayed saving is 20%.
- Recommendation: Either change the monthly reference to `$15/month` or change the annual saving label/calculation so all values agree.
- Status: Confirmed defect.

### F-002: Pricing differs between Pricing and FAQ pages

- Severity: Medium
- Area: Functional and data correctness
- URLs: `https://thaura.ai/pricing`, `https://thaura.ai/faq`
- Actual: Pricing displays `$12/month`; the FAQ answer says pricing is set at `$15`.
- Supporting evidence: A reply email from `info@thaura.ai` (2026-09-16) independently states Pro is "$15 a month," corroborating the FAQ value and suggesting the live Pricing page's `$12/month` is the outdated/incorrect value.
- Recommendation: Centralize pricing data and render the same source values across the Pricing page, FAQ, checkout, and marketing copy.
- Status: Confirmed inconsistency.

### F-003: Contact form has no visible client-side length limits

- Severity: Low to Medium
- Area: Functional correctness and input handling
- URL: `https://thaura.ai/contact`
- Evidence: `name`, `email`, `subject`, and `message` reported `maxLength: -1`.
- Actual: Long, Unicode, RTL, and script-like values returned `200` without reflection or a server error, but no client-side maximum lengths were exposed.
- Recommendation: Define documented server-side limits and matching client-side `maxlength` values, then test rejection behavior for oversized payloads.
- Status: Confirmed observation; server-side limits not observable from the public response.

### F-004: Firefox desktop remains on the loading spinner

- Severity: Medium
- Area: Cross-browser/device compatibility
- URL: `https://thaura.ai/`
- Reproduction:
  1. Run `npx playwright test --config=playwright.compat.config.ts --project=firefox-desktop`.
  2. Wait for the page load and hydration window.
  3. Observe the page remains on the centered loading spinner and body text remains empty.
- Expected: The public homepage should render usable content in Firefox desktop, as it does in Chromium, WebKit, and mobile Chromium.
- Actual: Firefox returned HTTP `200` but did not render page content within the test timeout.
- Evidence: `test-results/compatibility-Key-public-p-2e403-ss-the-compatibility-matrix-firefox-desktop/test-failed-1.png`.
- Recommendation: Investigate Firefox-specific hydration, JavaScript, or resource-loading behavior before claiming full cross-browser compatibility.
- Status: Confirmed compatibility failure in the current test environment.

### F-005: Contact-form reply exceeded the stated 24-hour response SLA

- Severity: Low
- Area: Functional correctness / customer communication
- URL: `https://thaura.ai/contact`
- Reproduction:
  1. Submit a valid Contact form message and note the submission timestamp.
  2. Observe the page's stated commitment: "We'll get back to you within 24 hours."
  3. Wait for a reply from Thaura.
- Expected: A reply arrives within 24 hours of submission, per the page's stated commitment.
- Actual: A manual submission on 2026-09-14 at 18:15:55 received a reply from `info@thaura.ai` on 2026-09-16 at 14:31, approximately 44 hours later.
- Evidence: Forwarded reply email quoting the original `noreply@thaura.ai` "New Contact Form Submission" notification (Name: Shohel Parves, Email: shoheltqtec@gmail.com, Subject: "Just checking", Date: 2026-09-14 18:15:55).
- Recommendation: Either resource the Contact inbox to meet the stated 24-hour commitment or adjust the displayed SLA text to match actual response times.
- Status: Single-instance observation; not a statistically confirmed pattern.

## 5. Contact Delivery Result

The Contact form test observed:

- `POST https://backend.thaura.ai/api/communications/send`
- Response status: `200`
- UI message: `Message sent successfully! We'll get back to you soon.`

The automated marker-based check could not confirm delivery from the dedicated OTP Gmail account, since that account is not the form's recipient mailbox. Independent confirmation was obtained outside the automated suite: a manual submission from `shoheltqtec@gmail.com` (Name: Shohel Parves, Subject: "Just checking", submitted 2026-09-14 18:15:55) received a reply from `info@thaura.ai` on 2026-09-16 14:31, quoting the original `noreply@thaura.ai` "New Contact Form Submission" notification with the same Name, Email, Subject, Date, and Message that were submitted.

- Submission/API behavior: Verified
- Actual recipient delivery: **Confirmed.** Notifications route through `noreply@thaura.ai` to a monitored mailbox, and a human replied from `info@thaura.ai` with accurate field data.
- Secondary observation: the reply arrived roughly 44 hours after submission, exceeding the page's stated 24-hour response commitment (see F-005).

## 6. Performance Results

### Lighthouse

The stored reports are available in [reports](.). Representative captured metrics:

| Page | FCP | LCP | CLS | TBT | Speed Index | TTFB/root document |
|---|---:|---:|---:|---:|---:|---:|
| Home | 1.7 s | 6.2 s | 0 | 640 ms | 4.0 s | 190 ms |
| Pricing | 1.8 s | 5.3 s | 0 | 190 ms | 4.1 s | 430 ms |
| FAQ | 1.3 s | 5.3 s | 0 | 300 ms | 3.7 s | 390 ms |
| `/api` | Not available | Not available | Not available | Not available | Not available | Anonymous `401` |

INP/FID was not available from these Lighthouse lab runs and was not inferred from other metrics.

The `/api` Lighthouse run could not produce performance metrics because the route returned `401`. The public API documentation page used by functional testing is `/api-platform`.

The Home Lighthouse report recorded these category scores:

- Performance: `0.59`
- Accessibility: `1.00`
- Best Practices: `0.96`
- SEO: `1.00`

### k6 minimum load

The generated report is [k6-minimum-report.html](k6-minimum-report.html).

- Endpoints: `/`, `/pricing`, `/api-platform`, `/faq`
- Virtual users: 2
- Duration: 20 seconds
- Requests: 26
- Failed requests: 0.00%
- Checks succeeded: 100.00%
- p95 response time: 633.46 ms
- Thresholds: failure rate below 5%; p95 below 3 seconds

This is a minimum smoke load, not a capacity, endurance, or stress test.

### Network and media

The key-page network test recorded approximately:

- Home: 90 requests, 996 KB known transfer
- Pricing: 83 requests, 1.04 MB known transfer
- API platform: 83 requests, 1.03 MB known transfer
- FAQ: 83 requests, 1.07 MB known transfer

The media inspection found WebP hero assets on Pricing, API platform, and FAQ, valid intrinsic image dimensions, and no eager below-the-fold images in the tested pages. No video asset appeared on those four pages.

## 7. Security Results

- HTTP redirects to HTTPS with status `301`.
- Checked pages returned CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.
- Public sensitive-exposure scan found no credential-shaped secrets or real stack traces in tested source, console, or response content.
- Authenticated `thaura_token` cookie:
  - `Secure: true`
  - `HttpOnly: true`
  - `SameSite: Lax`
  - Domain: `.thaura.ai`
  - Path: `/`
- Public unauthenticated page responses did not set cookies during the check.
- Anonymous `/api/auth/me` `401` responses are expected protection behavior, not a confirmed defect.

## 8. Authenticated API and Session Results

The saved Gmail/OTP Playwright state was verified against read-only endpoints:

| Endpoint | Anonymous | Authenticated |
|---|---:|---:|
| `/api/auth/me` | 401 | 200 |
| `/api/bootstrap` | 401 | 200 |
| `/api/user/settings` | 401 | 200 |
| `/api/plugins/list` | 200 | 200 |

Authenticated state persisted across navigation. Removing the session cookie caused `auth/me` to return `401` again.

## 9. Compatibility Results

The public homepage smoke test passed on:

- Chromium desktop
- WebKit desktop
- Chromium mobile profile

Firefox desktop returned HTTP `200` but remained on the loading spinner with no rendered body content. The compatibility matrix therefore currently fails for Firefox desktop.

This is compatibility smoke coverage, not exhaustive visual or workflow testing on every device/browser combination.

## 10. Remaining Limitations

1. Product workflows beyond discovered read-only API behavior are not fully tested, including chat creation, file upload, projects, artifacts, settings changes, and UI logout.
2. Full stress, endurance, and capacity testing was not performed; only the minimum k6 smoke load was run.
3. One-off factual claims such as Qwen3.8, more than 90 languages, EU infrastructure, and energy-efficiency wording require manual product-owner confirmation rather than automated cross-page comparison.
4. The `/api` Lighthouse route is protected and requires an authenticated or otherwise authorized audit path.
5. The 24-hour SLA finding (F-005) is based on a single observed reply and would need repeated sampling to confirm as a systemic pattern.

## 11. Recommended Priorities

1. Correct and centralize the pricing values and discount calculation.
2. Add explicit Contact field length limits and server-side rejection tests.
3. Run authenticated product workflow tests.
4. Use the k6 script as a baseline before any larger approved load plan.
5. Obtain product-owner confirmation for one-off factual and sustainability claims.
6. Monitor Contact-form response times against the stated 24-hour commitment across additional samples.
