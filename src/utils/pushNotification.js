const firebaseAdmin = require("../config/firebaseAdmin");
const { handlers } = require("./handlers");

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  if (!token) {
    console.warn("No device token provided for push notification.");
    return;
  }

  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: {
      ...data,
    },
  };

  try {
    const response = await firebaseAdmin.messaging().send(message);
    handlers.logger.info({ message: `Push notification sent: ${response}` });
    return { success: true, messageId: response };
  } catch (error) {
    handlers.logger.failed({
      message: `Push notification error: ${error.message}`,
    });

    // Robust error logging
    if (error.code === "messaging/invalid-argument") {
      handlers.logger.error({ message: "→ Invalid token or message format." });
    } else if (error.code === "messaging/registration-token-not-registered") {
      handlers.logger.error({
        message: "→ Token is no longer valid. Remove it from DB.",
      });
    } else {
      handlers.logger.error({
        message: "→ Unknown error while sending notification.",
      });
    }

    return { success: false, error: error.message };
  }
};
