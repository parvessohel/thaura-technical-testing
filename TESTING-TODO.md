# Thaura Testing TODO

## Contact-form delivery

- The contact form submission was accepted with `200 OK` by `backend.thaura.ai/api/communications/send` and the UI displayed a success message.
- A Gmail search across all folders found no submitted contact marker after the test; the inbox contained only Thaura OTP messages.
- The Gmail account is therefore confirmed as the OTP mailbox, but not as the contact-form recipient mailbox.
- Contact-form email delivery remains `Not independently verifiable` until the backend recipient is identified or a controlled recipient is configured.
- Preferred future option: use MailSlurp, Mailosaur, or another controlled mailbox and verify a unique message marker automatically.

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
