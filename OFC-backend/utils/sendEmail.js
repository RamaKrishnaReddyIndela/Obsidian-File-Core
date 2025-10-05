// utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Explicitly use Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // SSL port
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true, // Ensure TLS certificate is verified
      },
    });

    const info = await transporter.sendMail({
      from: `"Obsidian File Core" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
