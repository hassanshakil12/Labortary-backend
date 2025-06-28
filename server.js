require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const bcrypt = require("bcrypt");

const { handlers } = require("./src/utils/handlers");
const connectDB = require("./src/config/mongodb");
const sendEmail = require("./src/config/nodemailer");
const admin = require("./src/models/Admin.model");

const app = express();

const server =
  process.env.NODE_ENV !== "development"
    ? (() => {
        try {
          const options = {
            key: fs.readFileSync(),
            cert: fs.readFileSync(),
            ca: fs.readFileSync(),
          };

          return require("https").createServer(options, app);
        } catch (error) {
          handlers.logger.failed({
            objectType: "Server",
            message: error,
          });
          process.exit(1);
        }
      })()
    : require("http").createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(helmet());

app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

app.use(
  cors({
    origins: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  })
);

app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use(require("./src/routes/index"));

const adminSeeder = async () => {
  try {
    const email = process.env.ADMIN_EMAIL?.toLowerCase();
    const contactNumber = process.env.ADMIN_CONTACT_NUMBER;
    const plainPassword = process.env.ADMIN_PASSWORD;

    if (!email || !plainPassword || !contactNumber) {
      return handlers.logger.failed({
        objectType: "AdminSeeder",
        message:
          "Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_CONTACT_NUMBER in .env",
      });
    }

    const existingAdmin = await admin.findOne({ email });
    if (existingAdmin) {
      return handlers.logger.info({
        objectType: "AdminSeeder",
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const data = {
      fullName: "Admin",
      email,
      contactNumber,
      username: "admin",
      password: hashedPassword,
      jobRole: "Admin",
      address: "123 Admin Street, Admin City",
      gender: "Female",
      department: "Admin",
    };

    const newAdmin = await admin.create(data);

    if (newAdmin) {
      handlers.logger.success({
        objectType: "AdminSeeder",
        message: "Admin seeded successfully",
      });
    } else {
      handlers.logger.failed({
        objectType: "AdminSeeder",
        message: "Failed to seed admin",
      });
    }
  } catch (error) {
    handlers.logger.error({
      objectType: "AdminSeeder",
      message: `Admin Seeder Error: ${error.message}`,
    });
  }
};

app.get("/", (req, res) => {
  return res.send("Labortary is live...");
});

server.listen(process.env.PORT || 3000, () => {
  connectDB();
  adminSeeder();
  return handlers.logger.success({
    objectType: "Server",
    message: `Labortary is live on port ${process.env.PORT || 3000}`,
  });
});

process.on("SIGTERM", () => {
  handlers.logger.info({
    objectType: "Server",
    message: "Labortary server is shutting down...",
  });
  server.close();
});
