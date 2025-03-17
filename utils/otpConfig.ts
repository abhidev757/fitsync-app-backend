import nodemailer from 'nodemailer';

export function generateOTP(length: number = 4): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10).toString(); 
    }
    return otp;
}

export async function sendOTP(email: string, otp: string): Promise<void> {
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
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
}
