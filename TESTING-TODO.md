# Thaura Testing TODO

## Contact-form delivery — RESOLVED

- The contact form submission was accepted with `200 OK` by `backend.thaura.ai/api/communications/send` and the UI displayed a success message.
- The automated marker-based test (synthetic subject line, `contact-submission.spec.ts`) still cannot confirm delivery from the dedicated OTP Gmail account alone, because that account is not the form's recipient mailbox.
- Independent confirmation was obtained outside of the automated suite: a manual Contact form submission from `shoheltqtec@gmail.com` (Name: Shohel Parves, Subject: "Just checking", submitted 2026-09-14 18:15:55) received a reply from `info@thaura.ai` on 2026-09-16 14:31, sent in response to a forwarded `noreply@thaura.ai` "New Contact Form Submission" notification quoting the same Name, Email, Subject, Date, and Message text that was submitted.
- This confirms: (1) the contact form's backend delivers submissions to a monitored Thaura mailbox (notifications relayed from `noreply@thaura.ai`, replies sent from `info@thaura.ai`), (2) submitted field data (name/email/subject/message/timestamp) is transmitted accurately end-to-end, and (3) the channel is actively monitored by a human.
- Secondary observation: the Contact page states "We'll get back to you within 24 hours," but the observed reply arrived roughly 44 hours after submission (2026-09-14 18:15:55 to 2026-09-16 14:31), exceeding the stated SLA for this one observed instance. This is a single data point, not a statistically confirmed pattern.
- Status updated from `Not independently verifiable` to `Confirmed: delivery verified` in the Task 02 report and Excel bug register.

## Contact input limits

- Long, Unicode, RTL, and script-like input returned `200` from the contact endpoint without a server error or reflected script markup.
- The `name`, `email`, `subject`, and `message` fields expose no client-side `maxlength` attribute (`maxLength: -1`); server-side length limits were not observable from the public response.

## Pricing consistency

- Pricing displays `$12/month`, `Billed $144/year`, and `Save 20%`.
- `$12 x 12 = $144`, so the observed annual price represents a `0%` discount, not `20%`.
- The FAQ still references pricing set at `$15`, which conflicts with the current Pricing page's `$12/month` Pro price.
- A 20% discount from `$15/month` would produce `$144/year`; the public pages should use one consistent base price and calculation.

## Authenticated API surface

- Anonymous versus authenticated GET checks passed for the endpoints discovered during public-page navigation.
- `/api/auth/me`, `/api/bootstrap`, and `/api/user/settings` returned `401` anonymously and `200` with the saved authenticated state.
- `/api/plugins/list` returned `200` in both modes, indicating it is publicly readable.
- No unexpected `5xx` responses were observed in this read-only API check.

## Public route health

- All 14 public routes returned `200` in the expanded route-health test.
- The repeated anonymous `401` from `/api/auth/me` is expected and classified separately from unexpected failures.
- No unexpected HTTP error responses were observed in the checked public routes.
