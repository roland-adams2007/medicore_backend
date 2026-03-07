// emails/templates/loginNotification.html.js
const { EmailLayout } = require('../EmailLayout');

function LoginNotificationTemplate({
  userName = "there",
  loginTime,
  ipAddress,
  deviceInfo = "Unknown device",
  location  = "Unknown location",
}) {
  const content = `
    <!-- Label -->
    <p style="margin:0 0 6px 0;color:#8A9BB0;font-size:13px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;font-family:'DM Sans',sans-serif;">
        Security Alert
    </p>

    <!-- Heading -->
    <h2 style="margin:0 0 20px 0;color:#0D1117;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-0.3px;font-family:'DM Serif Display',Georgia,serif;">
        New sign-in to your <em style="color:#4A7C59;font-style:italic;">account</em>
    </h2>

    <p style="margin:0 0 32px 0;color:#0D1117;font-size:15px;line-height:26px;font-family:'DM Sans',sans-serif;">
        Hi ${userName}, we detected a new sign-in to your MediCore account. If this was you, no action is needed — we're just keeping you informed.
    </p>

    <!-- Login Details Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 36px 0;background-color:#ffffff;border:1.5px solid rgba(13,17,23,0.08);border-radius:12px;overflow:hidden;">
        <tr>
            <td style="padding:24px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;font-family:'DM Sans',sans-serif;">

                    <tr>
                        <td style="padding:10px 0;color:#8A9BB0;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;width:110px;vertical-align:middle;">Time</td>
                        <td style="padding:10px 0;color:#0D1117;font-weight:400;">${loginTime}</td>
                    </tr>
                    <tr><td colspan="2" style="border-top:1px solid rgba(13,17,23,0.06);padding:0;"></td></tr>

                    <tr>
                        <td style="padding:10px 0;color:#8A9BB0;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;vertical-align:middle;">Device</td>
                        <td style="padding:10px 0;color:#0D1117;font-weight:400;">${deviceInfo}</td>
                    </tr>
                    <tr><td colspan="2" style="border-top:1px solid rgba(13,17,23,0.06);padding:0;"></td></tr>

                    <tr>
                        <td style="padding:10px 0;color:#8A9BB0;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;vertical-align:middle;">IP Address</td>
                        <td style="padding:10px 0;color:#0D1117;font-weight:400;">${ipAddress}</td>
                    </tr>
                    <tr><td colspan="2" style="border-top:1px solid rgba(13,17,23,0.06);padding:0;"></td></tr>

                    <tr>
                        <td style="padding:10px 0;color:#8A9BB0;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;vertical-align:middle;">Location</td>
                        <td style="padding:10px 0;color:#0D1117;font-weight:400;">${location}</td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
            <td style="border-top:1px solid rgba(13,17,23,0.08);"></td>
        </tr>
    </table>

    <!-- Info note -->
    <p style="margin:0 0 36px 0;color:#8A9BB0;font-size:14px;line-height:24px;font-family:'DM Sans',sans-serif;">
        If this was you, you can safely ignore this email. We send these notifications as part of our security monitoring to keep your clinic data protected.
    </p>

    <!-- Wasn't you box -->
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="background-color:#FDF2F0;border-left:3px solid #C05C3C;border-radius:0 10px 10px 0;padding:20px 24px;">
                <p style="margin:0 0 8px 0;color:#3a1810;font-size:14px;font-weight:600;line-height:20px;font-family:'DM Sans',sans-serif;">
                    Wasn't you?
                </p>
                <p style="margin:0 0 20px 0;color:#C05C3C;font-size:13px;line-height:22px;font-family:'DM Sans',sans-serif;">
                    If you don't recognise this activity, secure your account immediately by resetting your password.
                </p>
                <a href="${process.env.APP_URL}/forgot-password"
                   style="display:inline-block;padding:12px 28px;background-color:#C05C3C;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:13px;font-family:'DM Sans',sans-serif;letter-spacing:0.01em;">
                    Secure My Account &rarr;
                </a>
            </td>
        </tr>
    </table>

    <!-- Footer tip -->
    <p style="margin:32px 0 0 0;color:#8A9BB0;font-size:13px;line-height:20px;font-family:'DM Sans',sans-serif;">
        For your security, we recommend using a strong unique password and never sharing your login credentials with anyone.
    </p>
  `;

  return EmailLayout({
    title: "New sign-in to your MediCore account",
    children: content,
  });
}

module.exports = { LoginNotificationTemplate };