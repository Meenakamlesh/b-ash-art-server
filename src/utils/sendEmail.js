const SibApiV3Sdk = require("@getbrevo/brevo");
require("dotenv").config();

if (!process.env.BREVO_API_KEY) {
  console.error("❌ ERROR: BREVO_API_KEY not set in .env");
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log(`📧 Attempting to send email to: ${to}`);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { name: "B Ash Arts Orders", email: process.env.EMAIL_USER };
    sendSmtpEmail.to = [{ email: to }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent to ${to}, messageId:`, result.body?.messageId);
    return result;
  } catch (error) {
    console.error(`❌ Email failed for ${to}:`, error.message);
    if (error.response?.body) {
      console.error(`❌ Brevo error details:`, JSON.stringify(error.response.body));
    }
    throw error;
  }
};

module.exports = sendEmail;