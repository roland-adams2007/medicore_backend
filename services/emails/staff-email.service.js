// services/email/authEmailService.js
const sendMail = require("../../utils/sendMail");
const { InviteStaffTemplate } = require("./emails/templates/invite-staff.html");
const { system } = require("../../config/config.inc");

async function sendInviteEmail({
  to,
  token,
  clinicName,
  branchName,
  roleName,
  inviterName,
}) {
  const inviteLink = `${system.APP_URL}/staff/invite/accept?token=${token}`;
  const subject = `You're invited to join ${clinicName} – MediCore`;

  const html = InviteStaffTemplate({
    inviteeName: "there",
    inviterName,
    clinicName,
    branchName,
    roleName,
    inviteLink,
  });

  await sendMail(to, subject, html);
}

module.exports = {
  sendInviteEmail,
};
