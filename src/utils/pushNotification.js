const admin = require("firebase-admin");

const sendNotification = async ({ token, title, body, data = {} }) => {
  const message = {
    notification: { title, body },
    token,
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Notification error:", error);
    return { success: false, error };
  }
};

module.exports = { sendNotification };
