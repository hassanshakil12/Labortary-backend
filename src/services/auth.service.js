const { handlers } = require("../utils/handlers");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");
const { generateToken } = require("../utils/generators");
const { sendNotification } = require("../utils/pushNotification");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.admin = require("../models/Admin.model");
    this.laboratory = require("../models/Laboratory.model");
    this.notification = require("../models/Notification.model");
  }

  async signIn(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return handlers.response.error({
          res,
          message: "All fields are required...",
        });
      }

      let user = await this.employee.findOne({ email });

      if (!user) {
        user = await this.laboratory.findOne({ email });
      }
      if (!user) {
        user = await this.admin.findOne({ email });
      }
      if (!user) {
        return handlers.response.unavailable({
          res,
          message: "User not found...",
        });
      }

      let admin = null;
      if (user.role !== "admin") {
        admin = await this.admin.findOne().select("_id");
        if (!admin) {
          return handlers.response.unavailable({
            res,
            message: "Admin not found...",
          });
        }
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return handlers.response.error({
          res,
          message: "Invalid credentials...",
        });
      }

      user.userAuthToken = generateToken(user._id, user.role);
      await user.save();

      this.notification.create({
        receiverId: user._id,
        adminId: user.role === "admin" ? user._id : admin._id,
        type: "alert",
        title: "Login Notification",
        body: `Hello ${user.fullName}, you have successfully logged in.`,
        isRead: false,
      });

      await sendEmail({
        to: user.email,
        subject: "Login Notification",
        text: `Hello ${user.fullName}, you have successfully logged in.`,
        html: `<p>Hello ${user.fullName},</p><p>You have successfully logged in.</p>`,
      });

      return handlers.response.success({
        res,
        message: "Login successful...",
        data: {
          _id: user._id,
          userAuthToken: user.userAuthToken,
          role: user.role,
        },
      });
    } catch (error) {
      handlers.logger.failed({ objectType: "API", message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async signOut(req, res) {
    try {
      const user = req.user;
      if (
        !user._id ||
        !user.userAuthToken ||
        !["admin", "employee", "laboratory"].includes(user.role)
      ) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access...",
        });
      }

      user.userAuthToken = null;
      await user.save();

      if (user.userAuthToken) {
        return handlers.response.error({
          res,
          message: "Failed to logout...",
        });
      }

      return handlers.response.success({
        res,
        message: "Logout successful...",
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }
}

module.exports = new Service();
