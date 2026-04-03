import sgMail from '@sendgrid/mail';

export function generateOTP(length: number = 4): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
}

export async function sendOTP(email: string, otp: string): Promise<void> {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

    const msg = {
        to: email,
        from: process.env.EMAIL_USER as string,
        subject: 'Your FitSync OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #1d4ed8;">FitSync – OTP Verification</h2>
                <p>Use the code below to verify your account. It expires in 10 minutes.</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 6px;">
                    ${otp}
                </div>
                <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error('SendGrid Error:', error.message);
        } else {
            console.error('SendGrid Error:', error);
        }
        throw error;
    }
}

