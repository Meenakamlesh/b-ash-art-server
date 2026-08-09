// server/src/utils/sendEmail.js

const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Verify credentials on startup
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ ERROR: EMAIL_USER or EMAIL_PASS not set in .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// ✅ Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email transporter ready");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`📧 Sending email to: ${to}`);
    const info = await transporter.sendMail({
      from: `"B Ash Arts Orders" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email failed for ${to}:`, error.message);
    throw error; // ✅ Throw error so caller knows it failed
  }
};

module.exports = sendEmail;