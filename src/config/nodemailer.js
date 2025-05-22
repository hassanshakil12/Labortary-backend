const nodemailer = require("nodemailer");
const { handlers } = require("../utils/handlers");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    return handlers.logger.failed({
      objectType: "Nodemailer",
      message: `Nodemailer Connection Error: ${error.message}`,
    });
  } else {
    return handlers.logger.success({
      objectType: "Nodemailer",
      message: `Nodemailer is ready to send emails`,
    });
  }
});

const sendEmail = async (to, subject, text, html) => {
  if (!to || !subject || !text) {
    return handlers.logger.failed({
      objectType: "Nodemailer",
      message: `Nodemailer Error: Missing required fields`,
    });
  }
  try {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return handlers.logger.failed({
          objectType: "Nodemailer",
          message: `Nodemailer Error: ${error}`,
        });
      } else {
        return handlers.logger.success({
          objectType: "Nodemailer",
          message: `Email sent: ${info.response}`,
        });
      }
    });
  } catch (error) {
    return handlers.logger.failed({
      objectType: "Nodemailer",
      message: `Nodemailer Error: ${error}`,
    });
  }
};

module.exports = sendEmail;
