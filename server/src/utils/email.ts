import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE !== 'false',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string, attachments?: { filename: string; content: Buffer }[]) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email SMTP credentials are not configured. Falling back to console log for development.');
    console.group('Email fallback');
    console.log('to:', to);
    console.log('subject:', subject);
    console.log('html:', html);
    if (attachments) console.log('attachments:', attachments.map((a) => a.filename));
    console.groupEnd();
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  });
};
