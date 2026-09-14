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
