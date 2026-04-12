export const getRegisterOtpHtml = ({ email, otp }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Verify Your Account</title>
<style>
html, body { margin: 0; padding: 0; }
body {
    background: #f6f7fb;
    color: #111;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
table { border-collapse: collapse; }
.wrapper { width: 100%; background: #f6f7fb; }
.container {
    width: 600px;
    max-width: 600px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e9ecf3;
}
.p-24 { padding: 24px; }
.p-32 { padding: 32px; }
.header { background: #111827; padding: 18px 24px; text-align: center; }
.brand { display: inline-block; color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; }
.title { margin: 0 0 12px 0; font-size: 22px; line-height: 1.3; color: #111; font-weight: 700; }
.text { margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #444; }
.muted { color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; }
.otp-wrap { margin: 20px 0; width: 100%; }
.otp {
    display: inline-block;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 32px;
    letter-spacing: 10px;
    font-weight: 700;
    color: #111;
}
.footer { text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6; padding: 16px 24px 0 24px; }
@media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .p-32 { padding: 24px !important; }
    .otp { font-size: 28px !important; letter-spacing: 6px !important; }
}
</style>
</head>
<body>
<table role="presentation" class="wrapper" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
<td align="center" class="p-24">
<table role="presentation" class="container" border="0" cellspacing="0" cellpadding="0">
<tr><td class="header"><span class="brand">WebIDE</span></td></tr>
<tr>
<td class="p-32">
<h1 class="title">Verify your account</h1>
<p class="text">Hi ${email}, thanks for registering! Use the OTP below to verify your account.</p>
<table role="presentation" class="otp-wrap" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center"><div class="otp">${otp}</div></td></tr>
</table>
<p class="muted">This code will expire in <strong>5 minutes</strong>.</p>
<p class="muted">If you didn't register, you can safely ignore this email.</p>
</td>
</tr>
<tr><td class="footer">© ${new Date().getFullYear()} WebIDE. All rights reserved.</td></tr>
<tr><td height="16" aria-hidden="true"></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};

export const getOtpHtml = ({ email, otp }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Login OTP</title>
<style>
html, body { margin: 0; padding: 0; }
body {
    background: #f6f7fb;
    color: #111;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
table { border-collapse: collapse; }
.wrapper { width: 100%; background: #f6f7fb; }
.container {
    width: 600px;
    max-width: 600px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e9ecf3;
}
.p-24 { padding: 24px; }
.p-32 { padding: 32px; }
.header { background: #111827; padding: 18px 24px; text-align: center; }
.brand { display: inline-block; color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; }
.title { margin: 0 0 12px 0; font-size: 22px; line-height: 1.3; color: #111; font-weight: 700; }
.text { margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #444; }
.muted { color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; }
.otp-wrap { margin: 20px 0; width: 100%; }
.otp {
    display: inline-block;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 32px;
    letter-spacing: 10px;
    font-weight: 700;
    color: #111;
}
.footer { text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6; padding: 16px 24px 0 24px; }
@media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .p-32 { padding: 24px !important; }
    .otp { font-size: 28px !important; letter-spacing: 6px !important; }
}
</style>
</head>
<body>
<table role="presentation" class="wrapper" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
<td align="center" class="p-24">
<table role="presentation" class="container" border="0" cellspacing="0" cellpadding="0">
<tr><td class="header"><span class="brand">WebIDE</span></td></tr>
<tr>
<td class="p-32">
<h1 class="title">Your login code</h1>
<p class="text">Use the verification code below to sign in to your account.</p>
<table role="presentation" class="otp-wrap" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center"><div class="otp">${otp}</div></td></tr>
</table>
<p class="muted">This code will expire in <strong>5 minutes</strong>.</p>
<p class="muted">If you didn't request this, you can safely ignore this email.</p>
</td>
</tr>
<tr><td class="footer">© ${new Date().getFullYear()} WebIDE. All rights reserved.</td></tr>
<tr><td height="16" aria-hidden="true"></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};

export const getResetPasswordOtpHtml = ({ email, otp }) => {
  const appName = "WebIDE";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Reset Your Password</title>
<style>
html, body { margin: 0; padding: 0; }
body {
    background: #f6f7fb;
    color: #111;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
table { border-collapse: collapse; }
.wrapper { width: 100%; background: #f6f7fb; }
.container {
    width: 600px;
    max-width: 600px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e9ecf3;
}
.p-24 { padding: 24px; }
.p-32 { padding: 32px; }
.header { background: #111827; padding: 18px 24px; text-align: center; }
.brand { display: inline-block; color: #ffffff; font-weight: 700; font-size: 16px; text-decoration: none; }
.title { margin: 0 0 12px 0; font-size: 22px; line-height: 1.3; color: #111; font-weight: 700; }
.text { margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #444; }
.muted { color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0; }
.otp-wrap { margin: 20px 0; width: 100%; }
.otp {
    display: inline-block;
    background: #fdf2f2;
    border: 1px solid #fee2e2;
    border-radius: 10px;
    padding: 14px 18px;
    font-size: 32px;
    letter-spacing: 10px;
    font-weight: 700;
    color: #b91c1c;
}
.footer { text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6; padding: 16px 24px 0 24px; }
@media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .p-32 { padding: 24px !important; }
    .otp { font-size: 28px !important; letter-spacing: 6px !important; }
}
</style>
</head>
<body>
<table role="presentation" class="wrapper" width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
<td align="center" class="p-24">
<table role="presentation" class="container" border="0" cellspacing="0" cellpadding="0">
<tr><td class="header"><span class="brand">${appName}</span></td></tr>
<tr>
<td class="p-32">
<h1 class="title">Reset your password</h1>
<p class="text">Hi ${email}, we received a request to reset your password. Use the verification code below to proceed.</p>
<table role="presentation" class="otp-wrap" border="0" cellspacing="0" cellpadding="0">
<tr><td align="center"><div class="otp">${otp}</div></td></tr>
</table>
<p class="muted">This code will expire in <strong>15 minutes</strong> for security.</p>
<p class="muted">If you didn't request this change, you can safely ignore this email.</p>
</td>
</tr>
<tr><td class="footer">© ${new Date().getFullYear()} ${appName}. All rights reserved.</td></tr>
<tr><td height="16" aria-hidden="true"></td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};
