const admin = require("firebase-admin");
const { handlers } = require("./handlers");

const sendNotification = async ({ token, title, body, data = {} }) => {
  const message = {
    notification: { title, body },
    token,
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    handlers.logger.success({
      message: "Notification sent successfully",
      data: response,
    });
    return { success: true, response };
  } catch (error) {
    handlers.logger.error({
      message: "Failed to send notification",
      data: error,
    });
    return { success: false, error };
  }
};

module.exports = { sendNotification };
