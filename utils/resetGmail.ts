import nodemailer from 'nodemailer';

export const sendResetEmail = async (email: string, resetLink: string) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="color: #333;">Hello!</h2>
      <p>We received a request to reset your password for your <strong>FitSync</strong> account. No worries, we’ve got you covered!</p>
      <p>To reset your password, click the button below:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" 
          style="background-color: #ffbe00; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset My Password
        </a>
      </div>
      <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>For any issues or help, feel free to contact us at <a href="mailto:support@fitsync.com">support@fitsync.com</a>.</p>
      <p>Thanks,<br/>The <strong>FitSync</strong> Team</p>
      <hr />
      <small style="color: #888;">If the button doesn't work, copy and paste the following link into your browser:</small><br />
      <a href="${resetLink}" style="color: #ffbe00;">${resetLink}</a>
    </div>
    `,
};


  await transporter.sendMail(mailOptions);
};
