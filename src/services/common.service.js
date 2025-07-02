const { handlers } = require("../utils/handlers");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");
const { generateOTP } = require("../utils/generators");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.appointment = require("../models/Appointment.model");
    this.notification = require("../models/Notification.model");
  }

  async getNoifications(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      const notifications = await this.notification
        .find({
          receiverId: user._id,
        })
        .sort({ createdAt: -1 });
      if (!notifications) {
        return handlers.response.unavailable({
          res,
          message: "No notifications found",
        });
      }

      return handlers.response.success({
        res,
        message: "Notifications retrieved successfully",
        data: notifications,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async deleteNotifications(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      const notification = await this.notification.deleteMany({
        receiverId: user._id,
      });
      if (!notification) {
        return handlers.response.unavailable({
          res,
          message: "Notifications not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Notifications deleted successfully",
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async toggleNotification(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      user.isNotification = !user.isNotification;
      await user.save();

      return handlers.response.success({
        res,
        message: `Notification ${
          user.isNotification ? "enabled" : "disabled"
        } successfully`,
        data: user,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async toggleAccount(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      return handlers.response.success({
        res,
        message: `Account ${
          user.isActive ? "activated" : "deactivated"
        } successfully`,
        data: user,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      if (user.role === "employee") {
        const {
          fullName,
          email,
          contactNumber,
          address,
          gender,
          username,
          about,
        } = req.body;

        if (
          !fullName ||
          !email ||
          !contactNumber ||
          !username ||
          !about ||
          !gender ||
          !address
        ) {
          return handlers.response.error({
            res,
            message: "All fields are required",
          });
        }

        let image = user.image || null;
        if (req.files?.image?.[0]) {
          const file = req.files.image[0];
          const folder = file.uploadFolder;
          const filename = file.savedFilename;
          image = `uploads/${folder}/${filename}`.replace(/\\/g, "/");
        }

        const existingUser = await this.employee.findOne({
          $or: [{ email }, { contactNumber }, { username }],
          _id: { $ne: user._id },
        });
        if (existingUser) {
          return handlers.response.error({
            res,
            message: "Email, contact number, or username already exists",
          });
        }

        user.fullName = fullName;
        user.email = email;
        user.contactNumber = contactNumber;
        user.address = address;
        user.gender = gender;
        user.username = username;
        user.address = address;
        user.about = about;
        user.image = image;
        await user.save();

        if (user.isNotification) {
          await this.notification.create({
            receiverId: user._id,
            type: "system",
            title: "Profile Updated",
            body: `You have successfully updated your profile.`,
            isRead: false,
          });
        }

        return handlers.response.success({
          res,
          message: "Profile updated successfully",
          data: user,
        });
      } else if (user.role === "admin") {
        const {
          fullName,
          email,
          contactNumber,
          address,
          gender,
          username,
          about,
          jobRole,
          hireDate,
        } = req.body;

        if (
          !fullName ||
          !email ||
          !contactNumber ||
          !username ||
          !about ||
          !gender ||
          !address ||
          !jobRole ||
          !hireDate
        ) {
          return handlers.response.error({
            res,
            message: "All fields are required",
          });
        }

        let image = user.image || null;
        if (req.files?.image?.[0]) {
          const file = req.files.image[0];
          const folder = file.uploadFolder;
          const filename = file.savedFilename;
          image = `uploads/${folder}/${filename}`.replace(/\\/g, "/");
        }

        const existingUser = await this.employee.findOne({
          $or: [{ email }, { contactNumber }, { username }],
          _id: { $ne: user._id },
        });
        if (existingUser) {
          return handlers.response.error({
            res,
            message: "Email, contact number, or username already exists",
          });
        }

        user.fullName = fullName;
        user.email = email;
        user.contactNumber = contactNumber;
        user.address = address;
        user.gender = gender;
        user.username = username;
        user.address = address;
        user.about = about;
        user.jobRole = jobRole;
        user.hireDate = hireDate;
        user.image = image;
        await user.save();

        if (user.isNotification) {
          await this.notification.create({
            receiverId: user._id,
            type: "system",
            title: "Profile Updated",
            body: `You have successfully updated your profile.`,
            isRead: false,
          });
        }

        return handlers.response.success({
          res,
          message: "Profile updated successfully",
          data: user,
        });
      } else {
        return handlers.response.error({
          res,
          message: "You are not authorized to update this profile",
        });
      }
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return handlers.response.error({
          res,
          message: "Old and new passwords are required",
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return handlers.response.unauthorized({
          res,
          message: "Old password is incorrect",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      if (user.isNotification) {
        await this.notification.create({
          receiverId: user._id,
          type: "system",
          title: "Password Updated",
          body: `You have successfully updated your accoount pasword at ${new Date()}.`,
          isRead: false,
        });
      }

      return handlers.response.success({
        res,
        message: "Password changed successfully",
        data: user,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async forgetPassword(req, res) {
    try {
      const { email, role } = req.body;
      if (!email || !role) {
        return handlers.response.error({
          res,
          message: "Email and role are required",
        });
      }

      const model = role === "admin" ? this.admin : this.employee;
      const user = await model.findOne({ email });

      if (!user) {
        return handlers.response.unavailable({
          res,
          message: "User not found",
        });
      }

      const otp = generateOTP(); // secure random OTP
      user.forgetPasswordOTP = otp;
      await user.save();

      await sendEmail(
        user.email,
        "Forget Password OTP",
        "Here is the OTP to reset your password",
        `<p>Dear ${user.fullName},</p>
         <p>Your OTP for resetting your password is: <strong>${otp}</strong></p>
         <p>Please use this OTP to reset your password.</p>
         <p>Thank you,</p>`
      );

      return handlers.response.success({
        res,
        message: "OTP has been sent to your email",
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async verifyForgetPasswordOTP(req, res) {
    try {
      const { email, otp, role } = req.body;
      if (!email || !otp || !role) {
        return handlers.response.error({
          res,
          message: "Email, OTP, and role are required",
        });
      }

      const model = role === "admin" ? this.admin : this.employee;
      const user = await model.findOne({ email });

      if (!user) {
        return handlers.response.unavailable({
          res,
          message: "User not found",
        });
      }

      if (user.forgetPasswordOTP !== otp) {
        return handlers.response.error({
          res,
          message: "Invalid OTP",
        });
      }

      return handlers.response.success({
        res,
        message: "OTP verified successfully",
        data: { userId: user._id },
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { userId, newPassword, role } = req.body;
      if (!userId || !newPassword || !role) {
        return handlers.response.error({
          res,
          message: "User ID, new password, and role are required",
        });
      }

      const model = role === "admin" ? this.admin : this.employee;
      const user = await model.findById(userId);

      if (!user) {
        return handlers.response.unavailable({
          res,
          message: "User not found",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.forgetPasswordOTP = null;
      await user.save();

      if (user.isNotification) {
        await this.notification.create({
          receiverId: user._id,
          type: "system",
          title: "Password Reset",
          body: `You have successfully reset your password at ${new Date()}.`,
          isRead: false,
        });
      }

      return handlers.response.success({
        res,
        message: "Password reset successfully",
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }
}

module.exports = new Service();
