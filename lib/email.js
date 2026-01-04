import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendTeamInvitationEmail({ to, teamName, invitedBy }) {
  const subject = `You've been added to team: ${teamName}`;
  const text = `Hello,\n\nYou have been added to the team "${teamName}" by ${invitedBy}.\n\nYou can now collaborate with your team members on the Kanban Board application.\n\nBest regards,\nKanban Board Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Team Invitation</h2>
      <p>Hello,</p>
      <p>You have been added to the team <strong>"${teamName}"</strong> by <strong>${invitedBy}</strong>.</p>
      <p>You can now collaborate with your team members on the Kanban Board application.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">Best regards,<br>Kanban Board Team</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}
