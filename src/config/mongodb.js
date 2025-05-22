const mongoose = require("mongoose");
const { handlers } = require("../utils/handlers");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const db = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    handlers.logger.success({
      objectType: "MongoDB",
      message: `Labortary database is live on ${db.connection.host}`,
    });

    mongoose.connection.on("disconnected", () => {
      handlers.logger.error({
        objectType: "MongoDB",
        message: "MongoDB Disconnected",
      });
    });

    mongoose.connection.on("reconnected", () => {
      handlers.logger.success({
        objectType: "MongoDB",
        message: "MongoDB Reconnected",
      });
    });

    mongoose.connection.on("error", (error) => {
      handlers.logger.error({
        objectType: "MongoDB",
        message: `MongoDB Error: ${error}`,
      });
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      handlers.logger.success({
        objectType: "MongoDB",
        message: "MongoDB connection closed on app termination",
      });
      process.exit(0);
    });
  } catch (error) {
    handlers.logger.failed({
      objectType: "MongoDB",
      message: error,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
