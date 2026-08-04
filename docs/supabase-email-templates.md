# Supabase Auth Email Templates — InternIQ

Copy-paste ready HTML for **Supabase → Authentication → Email Templates**.

Design language matches the InternIQ transactional email system
(`lib/email/templates.ts`): green gradient header, white content card,
table-based (email-client safe), mobile responsive.

**IMPORTANT — Supabase placeholders:**

- Templates use Supabase's Go templating. Do NOT remove or rename any
  `{{ .Var }}` placeholder.
- Optional values (`.Token`, `.SiteURL`, `.RedirectTo`) are wrapped in
  `{{ with ... }}…{{ end }}` blocks — Supabase renders nothing when they're
  empty, so no dangling text appears.
- The button URL is always `{{ .ConfirmationURL }}` (quoted inside the
  attribute; Supabase's html/template escapes it safely).
- Each template also shows the raw variables at the bottom of its section for
  reference.

---

## 1. Confirm Signup

**Subject:** `Confirm Your Signup`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your InternIQ account</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Header / Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <!-- InternIQ logo placeholder: replace with <img src="https://your-domain.com/logo.png" width="120" alt="InternIQ" /> when available -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);border-radius:12px;padding:8px 18px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">Welcome to InternIQ 🎉</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Hi{{ with .Email }} {{ . }}{{ end }},</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                      Thanks for signing up! Please confirm your email address to activate your
                      account and start using InternIQ — your AI-powered internship recruitment platform.
                    </p>

                    <!-- Primary CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                      <tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);">
                          <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">Confirm Email</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.6;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 16px;font-size:12px;color:#0b1f3a;word-break:break-all;">{{ .ConfirmationURL }}</p>

                    <!-- Redirect target (only shown when set) -->
                    {{ with .RedirectTo }}<p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">You'll be taken to {{ . }} after confirming.</p>{{ end }}

                    <!-- OTP code fallback (only shown for OTP flows) -->
                    {{ with .Token }}<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">Or use your confirmation code: <strong style="color:#0b1f3a;font-family:'Courier New',monospace;letter-spacing:0.15em;">{{ . }}</strong></p>{{ end }}

                    <!-- Security note -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;font-size:12px;color:#92400e;line-height:1.6;">
                          <strong>🔒 Security note:</strong> If you didn't create an account on
                          <span style="color:#0b1f3a;">{{ .SiteURL }}</span>, you can safely ignore this email.
                          Never share your confirmation link or code with anyone.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                <strong style="color:#475569;">InternIQ</strong> · AI-Powered Internship Recruitment Platform
              </p>
              <!-- Social links (placeholders) -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto;">
                <tr>
                  <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">LinkedIn</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://x.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">X / Twitter</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://github.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">GitHub</a></td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                Need help? Contact <a href="mailto:support@interniq.app" style="color:#17C6B5;text-decoration:underline;">support@interniq.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 InternIQ. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link Login

**Subject:** `Your Magic Link`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your InternIQ magic link</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Header / Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <!-- InternIQ logo placeholder: replace with <img src="https://your-domain.com/logo.png" width="120" alt="InternIQ" /> when available -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);border-radius:12px;padding:8px 18px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">Your magic login link ✨</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Hi{{ with .Email }} {{ . }}{{ end }},</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                      Click the button below to securely sign in to your InternIQ account.
                      This link works once and expires shortly.
                    </p>

                    <!-- Primary CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                      <tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);">
                          <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">Sign In</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.6;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 16px;font-size:12px;color:#0b1f3a;word-break:break-all;">{{ .ConfirmationURL }}</p>

                    <!-- Redirect target (only shown when set) -->
                    {{ with .RedirectTo }}<p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">You'll be taken to {{ . }} after signing in.</p>{{ end }}

                    <!-- OTP code fallback (only shown for OTP flows) -->
                    {{ with .Token }}<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">Or use your login code: <strong style="color:#0b1f3a;font-family:'Courier New',monospace;letter-spacing:0.15em;">{{ . }}</strong></p>{{ end }}

                    <!-- Security note -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;font-size:12px;color:#92400e;line-height:1.6;">
                          <strong>🔒 Security note:</strong> If you didn't request this magic link,
                          you can safely ignore this email. You can always sign in at
                          <span style="color:#0b1f3a;">{{ .SiteURL }}</span>. Never share this link with anyone.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                <strong style="color:#475569;">InternIQ</strong> · AI-Powered Internship Recruitment Platform
              </p>
              <!-- Social links (placeholders) -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto;">
                <tr>
                  <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">LinkedIn</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://x.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">X / Twitter</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://github.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">GitHub</a></td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                Need help? Contact <a href="mailto:support@interniq.app" style="color:#17C6B5;text-decoration:underline;">support@interniq.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 InternIQ. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Password Reset

**Subject:** `Reset Your Password`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your InternIQ password</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Header / Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <!-- InternIQ logo placeholder: replace with <img src="https://your-domain.com/logo.png" width="120" alt="InternIQ" /> when available -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);border-radius:12px;padding:8px 18px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">Reset your password 🔐</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Hi{{ with .Email }} {{ . }}{{ end }},</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                      We received a request to reset the password for your InternIQ account.
                      Click the button below to choose a new password. This link expires shortly.
                    </p>

                    <!-- Primary CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                      <tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);">
                          <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">Reset Password</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.6;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 16px;font-size:12px;color:#0b1f3a;word-break:break-all;">{{ .ConfirmationURL }}</p>

                    <!-- Redirect target (only shown when set) -->
                    {{ with .RedirectTo }}<p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">You'll be taken to {{ . }} after resetting your password.</p>{{ end }}

                    <!-- OTP code fallback (only shown for OTP flows) -->
                    {{ with .Token }}<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">Or use your reset code: <strong style="color:#0b1f3a;font-family:'Courier New',monospace;letter-spacing:0.15em;">{{ . }}</strong></p>{{ end }}

                    <!-- Security note -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;font-size:12px;color:#92400e;line-height:1.6;">
                          <strong>🔒 Security note:</strong> If you didn't request a password reset,
                          you can safely ignore this email — your password will not be changed.
                          You can always visit <span style="color:#0b1f3a;">{{ .SiteURL }}</span> to sign in.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                <strong style="color:#475569;">InternIQ</strong> · AI-Powered Internship Recruitment Platform
              </p>
              <!-- Social links (placeholders) -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto;">
                <tr>
                  <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">LinkedIn</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://x.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">X / Twitter</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://github.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">GitHub</a></td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                Need help? Contact <a href="mailto:support@interniq.app" style="color:#17C6B5;text-decoration:underline;">support@interniq.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 InternIQ. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email

**Subject:** `Confirm Change of Email`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your new email</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Header / Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <!-- InternIQ logo placeholder: replace with <img src="https://your-domain.com/logo.png" width="120" alt="InternIQ" /> when available -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);border-radius:12px;padding:8px 18px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">Confirm your new email 📧</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Hi{{ with .Email }} {{ . }}{{ end }},</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                      You requested to change the email address on your InternIQ account.
                      Confirm your new address (<strong style="color:#0b1f3a;">{{ .NewEmail }}</strong>)
                      by clicking the button below.
                    </p>

                    <!-- Primary CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                      <tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);">
                          <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">Confirm New Email</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.6;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 16px;font-size:12px;color:#0b1f3a;word-break:break-all;">{{ .ConfirmationURL }}</p>

                    <!-- Redirect target (only shown when set) -->
                    {{ with .RedirectTo }}<p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">You'll be taken to {{ . }} after confirming.</p>{{ end }}

                    <!-- OTP code fallback (only shown for OTP flows) -->
                    {{ with .Token }}<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">Or use your verification code: <strong style="color:#0b1f3a;font-family:'Courier New',monospace;letter-spacing:0.15em;">{{ . }}</strong></p>{{ end }}

                    <!-- Security note -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;font-size:12px;color:#92400e;line-height:1.6;">
                          <strong>🔒 Security note:</strong> If you didn't request this email change,
                          please contact support immediately — your account may be at risk.
                          Your current account lives at <span style="color:#0b1f3a;">{{ .SiteURL }}</span>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                <strong style="color:#475569;">InternIQ</strong> · AI-Powered Internship Recruitment Platform
              </p>
              <!-- Social links (placeholders) -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto;">
                <tr>
                  <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">LinkedIn</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://x.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">X / Twitter</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://github.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">GitHub</a></td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                Need help? Contact <a href="mailto:support@interniq.app" style="color:#17C6B5;text-decoration:underline;">support@interniq.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 InternIQ. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Invite User

**Subject:** `You have been invited`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to InternIQ</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Header / Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <!-- InternIQ logo placeholder: replace with <img src="https://your-domain.com/logo.png" width="120" alt="InternIQ" /> when available -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);border-radius:12px;padding:8px 18px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">InternIQ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#0b1f3a;letter-spacing:-0.3px;">You're invited to InternIQ 🎉</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">Hi{{ with .Email }} {{ . }}{{ end }},</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
                      You've been invited to join
                      <span style="color:#0b1f3a;"><strong>{{ .SiteURL }}</strong></span> on
                      InternIQ — the AI-powered internship recruitment platform. Create your
                      account to get started.
                    </p>

                    <!-- Primary CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                      <tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#0F9D8A 0%,#17C6B5 60%,#2DD4BF 100%);">
                          <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">Accept Invite</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0 0 6px;font-size:13px;color:#475569;line-height:1.6;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <p style="margin:0 0 16px;font-size:12px;color:#0b1f3a;word-break:break-all;">{{ .ConfirmationURL }}</p>

                    <!-- Redirect target (only shown when set) -->
                    {{ with .RedirectTo }}<p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">You'll be taken to {{ . }} after accepting.</p>{{ end }}

                    <!-- OTP code fallback (only shown for OTP flows) -->
                    {{ with .Token }}<p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">Or use your invite code: <strong style="color:#0b1f3a;font-family:'Courier New',monospace;letter-spacing:0.15em;">{{ . }}</strong></p>{{ end }}

                    <!-- Security note -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;font-size:12px;color:#92400e;line-height:1.6;">
                          <strong>🔒 Security note:</strong> If you weren't expecting this invitation,
                          you can safely ignore this email. Invitations are only sent by existing
                          InternIQ users on <span style="color:#0b1f3a;">{{ .SiteURL }}</span>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                <strong style="color:#475569;">InternIQ</strong> · AI-Powered Internship Recruitment Platform
              </p>
              <!-- Social links (placeholders) -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto;">
                <tr>
                  <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">LinkedIn</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://x.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">X / Twitter</a></td>
                  <td style="padding:0 8px;color:#cbd5e1;">·</td>
                  <td style="padding:0 8px;"><a href="https://github.com/interniq" style="font-size:11px;color:#17C6B5;text-decoration:none;font-weight:600;">GitHub</a></td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                Need help? Contact <a href="mailto:support@interniq.app" style="color:#17C6B5;text-decoration:underline;">support@interniq.app</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© 2026 InternIQ. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
