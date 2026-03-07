// emails/templates/verify-email.html.js
const { EmailLayout } = require('../EmailLayout');

function VerifyEmailTemplate({ userName = "there", verificationLink }) {
    const content = `
    <!-- Greeting -->
    <p style="margin:0 0 6px 0;color:#8A9BB0;font-size:13px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;font-family:'DM Sans',sans-serif;">
        Email Verification
    </p>

    <h2 style="margin:0 0 20px 0;color:#0D1117;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-0.3px;font-family:'DM Serif Display',Georgia,serif;">
        Verify your <em style="color:#4A7C59;font-style:italic;">email</em>${userName !== "there" ? `, ${userName}` : ''}
    </h2>

    <p style="margin:0 0 32px 0;color:#0D1117;font-size:15px;line-height:26px;">
        Welcome to MediCore — Nigeria's healthcare management platform. To activate your account and start managing your clinic, please verify your email address.
    </p>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 40px 0;">
        <tr>
            <td align="left">
                <a href="${verificationLink}"
                   style="display:inline-block;padding:15px 44px;background-color:#4A7C59;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;font-family:'DM Sans',sans-serif;letter-spacing:0.01em;">
                    Verify Email Address &rarr;
                </a>
            </td>
        </tr>
    </table>

    <!-- Divider -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
        <tr>
            <td style="border-top:1px solid rgba(13,17,23,0.08);"></td>
        </tr>
    </table>

    <!-- Alternative link -->
    <p style="margin:0 0 6px 0;color:#8A9BB0;font-size:13px;line-height:20px;">
        Button not working? Copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 36px 0;color:#8A9BB0;font-size:12px;line-height:20px;word-break:break-all;">
        ${verificationLink}
    </p>

    <!-- Security Notice -->
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="background-color:#E8F2EB;border-left:3px solid #4A7C59;border-radius:0 10px 10px 0;padding:18px 22px;">
                <p style="margin:0 0 6px 0;color:#2F5C3A;font-size:13px;font-weight:600;line-height:18px;font-family:'DM Sans',sans-serif;">
                    Security Notice
                </p>
                <p style="margin:0;color:#4A7C59;font-size:13px;line-height:20px;font-family:'DM Sans',sans-serif;">
                    This link expires in <strong>a day</strong>. If you didn't create a MediCore account, you can safely ignore this email or contact us at <a href="mailto:support@medicore.ng" style="color:#4A7C59;font-weight:600;text-decoration:none;">support@medicore.ng</a>.
                </p>
            </td>
        </tr>
    </table>
    `;

    return EmailLayout({
        title: "Verify your email – MediCore",
        children: content,
    });
}

module.exports = { VerifyEmailTemplate };