import nodemailer from 'nodemailer';

export const sendResetEmail = async (email: string, resetLink: string) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
    tls: {
      rejectUnauthorized: false 
    }
  });

  const mailOptions = {
    from: `"FitSync Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
      <h2 style="color: #333;">Hello!</h2>
      <p>We received a request to reset your password for your <strong>FitSync</strong> account. No worries, we’ve got you covered!</p>
      <p>To reset your password, click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
          style="background-color: #ffbe00; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          Reset My Password
        </a>
      </div>
      <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>Thanks,<br/>The <strong>FitSync</strong> Team</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <small style="color: #888;">If the button doesn't work, copy and paste this link:</small><br />
      <a href="${resetLink}" style="color: #ffbe00; word-break: break-all;">${resetLink}</a>
    </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to ${email}`);
  } catch (error) {
    console.error("Nodemailer Reset Email Error:", error);
    throw new Error("Could not send reset email");
  }
};