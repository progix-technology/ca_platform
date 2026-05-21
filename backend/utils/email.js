import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text, isHtml = false) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn('SMTP credentials are missing. Email will not be sent to', to);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: smtpUser,
    to,
    subject,
    ...(isHtml ? { html: text } : { text }),
  });
};