// emails/EmailLayout.js
function EmailLayout({ children, title = "MediCore" }) {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#EDEAE4;">

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#EDEAE4;">
        <tr>
            <td align="center" style="padding:40px 16px;">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

                    <!-- Header / Logo -->
                    <tr>
                        <td style="background-color:#F7F4EF;border-radius:14px 14px 0 0;padding:28px 40px 24px 40px;border-bottom:1px solid rgba(13,17,23,0.07);">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <!-- Logo mark -->
                                                <td style="padding-right:10px;vertical-align:middle;">
                                                    <div style="width:36px;height:36px;background:linear-gradient(135deg,#4A7C59,#2F5C3A);border-radius:9px;display:flex;align-items:center;justify-content:center;">
                                                        <img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/airplayvideo.svg" width="0" height="0" alt="" style="display:none;" />
                                                        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                                            <tr>
                                                                <td align="center" valign="middle" style="width:36px;height:36px;background:linear-gradient(135deg,#4A7C59,#2F5C3A);border-radius:9px;">
                                                                    <span style="font-size:18px;line-height:1;color:#ffffff;">&#9661;</span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </div>
                                                </td>
                                                <td style="vertical-align:middle;">
                                                    <span style="font-family:'DM Serif Display',Georgia,serif;font-size:20px;color:#0D1117;line-height:1;display:block;">MediCore</span>
                                                    <span style="font-family:'DM Sans',sans-serif;font-size:11px;color:#8A9BB0;display:block;margin-top:2px;">Healthcare Management Platform</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="background-color:#F7F4EF;padding:40px 40px 48px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color:#0D1117;font-size:15px;line-height:26px;font-weight:400;">
                                        ${children}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#EEE9E2;border-radius:0 0 14px 14px;padding:28px 40px 32px 40px;border-top:1px solid rgba(13,17,23,0.07);">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-bottom:16px;">
                                        <p style="margin:0;color:#8A9BB0;font-size:13px;line-height:20px;">
                                            Questions? Reach us at <a href="mailto:support@medicore.ng" style="color:#4A7C59;text-decoration:none;font-weight:500;">support@medicore.ng</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom:20px;">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-right:20px;">
                                                    <a href="#" style="color:#8A9BB0;font-size:12px;text-decoration:none;font-family:'DM Sans',sans-serif;">Help Centre</a>
                                                </td>
                                                <td style="padding-right:20px;">
                                                    <a href="#" style="color:#8A9BB0;font-size:12px;text-decoration:none;font-family:'DM Sans',sans-serif;">Privacy Policy</a>
                                                </td>
                                                <td>
                                                    <a href="#" style="color:#8A9BB0;font-size:12px;text-decoration:none;font-family:'DM Sans',sans-serif;">Terms of Service</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border-top:1px solid rgba(13,17,23,0.07);padding-top:16px;">
                                        <p style="margin:0;color:#B0B8C4;font-size:12px;line-height:18px;">
                                            © ${year} MediCore Healthcare Technologies Ltd. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Unsubscribe -->
                    <tr>
                        <td style="padding:20px 0 0 0;text-align:center;">
                            <p style="margin:0;color:#B0B8C4;font-size:11px;line-height:16px;font-family:'DM Sans',sans-serif;">
                                This email was sent to you by MediCore. <a href="#" style="color:#B0B8C4;text-decoration:underline;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
  `.trim();
}

module.exports = { EmailLayout };