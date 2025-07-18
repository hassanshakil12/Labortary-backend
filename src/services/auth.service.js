const { handlers } = require("../utils/handlers");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");
const { generateToken } = require("../utils/generators");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.admin = require("../models/Admin.model");
    this.laboratory = require("../models/Laboratory.model");
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

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return handlers.response.error({
          res,
          message: "Invalid credentials...",
        });
      }

      user.userAuthToken = generateToken(user._id, user.role);
      await user.save();

      sendEmail({
        to: user.email,
        subject: "Login Notification",
        text: `Hello ${user.fullName}, you have successfully logged in.`,
        html: `<p>Hello ${user.fullName},</p><p>You have successfully logged in.</p>`,
      });

      return handlers.response.success({
        res,
        message: "Login successful...",
        data: {
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
        !["admin", "employee", "laboratory"].includes(user.role) ||
        user.userAuthToken !== req.headers.authorization
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
