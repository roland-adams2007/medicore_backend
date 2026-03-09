// emails/templates/invite-staff.html.js
const { EmailLayout } = require('../EmailLayout');

function InviteStaffTemplate({
    inviteeName = "there",
    inviterName = "Your clinic admin",
    clinicName = "your clinic",
    branchName = null,
    roleName = "Staff Member",
    inviteLink,
}) {
    const locationLine = branchName
        ? `${branchName} — ${clinicName}`
        : clinicName;

    const content = `
    <!-- Greeting -->
    <p style="margin:0 0 6px 0;color:#8A9BB0;font-size:13px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;font-family:'DM Sans',sans-serif;">
        Staff Invitation
    </p>
    <h2 style="margin:0 0 20px 0;color:#0D1117;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-0.3px;font-family:'DM Serif Display',Georgia,serif;">
        You've been <em style="color:#4A7C59;font-style:italic;">invited</em>${inviteeName !== "there" ? `, ${inviteeName}` : ''}
    </h2>
    <p style="margin:0 0 32px 0;color:#0D1117;font-size:15px;line-height:26px;">
        <strong style="color:#0D1117;">${inviterName}</strong> has invited you to join <strong style="color:#0D1117;">${locationLine}</strong> on MediCore as a <strong style="color:#0D1117;">${roleName}</strong>. Accept the invitation below to set up your account and get started.
    </p>

    <!-- Role / Clinic info card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
        <tr>
            <td style="background-color:#F5F8F6;border-radius:12px;padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding:0 0 14px 0;border-bottom:1px solid rgba(13,17,23,0.08);">
                            <p style="margin:0 0 3px 0;color:#8A9BB0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Sans',sans-serif;">Clinic</p>
                            <p style="margin:0;color:#0D1117;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;">${clinicName}</p>
                        </td>
                    </tr>
                    ${branchName ? `
                    <tr>
                        <td style="padding:14px 0;border-bottom:1px solid rgba(13,17,23,0.08);">
                            <p style="margin:0 0 3px 0;color:#8A9BB0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Sans',sans-serif;">Branch</p>
                            <p style="margin:0;color:#0D1117;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;">${branchName}</p>
                        </td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding-top:14px;">
                            <p style="margin:0 0 3px 0;color:#8A9BB0;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;font-family:'DM Sans',sans-serif;">Your Role</p>
                            <p style="margin:0;color:#4A7C59;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;">${roleName}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 40px 0;">
        <tr>
            <td align="left">
                <a href="${inviteLink}"
                   style="display:inline-block;padding:15px 44px;background-color:#4A7C59;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;font-family:'DM Sans',sans-serif;letter-spacing:0.01em;">
                    Accept Invitation &rarr;
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
        ${inviteLink}
    </p>

    <!-- Security Notice -->
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="background-color:#E8F2EB;border-left:3px solid #4A7C59;border-radius:0 10px 10px 0;padding:18px 22px;">
                <p style="margin:0 0 6px 0;color:#2F5C3A;font-size:13px;font-weight:600;line-height:18px;font-family:'DM Sans',sans-serif;">
                    Security Notice
                </p>
                <p style="margin:0;color:#4A7C59;font-size:13px;line-height:20px;font-family:'DM Sans',sans-serif;">
                    This invitation expires in <strong>48 hours</strong>. If you weren't expecting this or don't recognise <strong>${clinicName}</strong>, you can safely ignore this email or contact us at <a href="mailto:support@medicore.ng" style="color:#4A7C59;font-weight:600;text-decoration:none;">support@medicore.ng</a>.
                </p>
            </td>
        </tr>
    </table>
    `;

    return EmailLayout({
        title: `You're invited to join ${clinicName} – MediCore`,
        children: content,
    });
}

module.exports = { InviteStaffTemplate };