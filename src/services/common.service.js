const { handlers } = require("../utils/handlers");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");
const { generateOTP } = require("../utils/generators");
const admin = require("../config/firebaseAdmin");
const { sendNotification } = require("../utils/pushNotification");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.appointment = require("../models/Appointment.model");
    this.notification = require("../models/Notification.model");
    this.laboratory = require("../models/Laboratory.model");
  }

  async getNotifications(req, res) {
    try {
      const user = req.user;
      if (
        !user._id ||
        !["admin", "employee", "laboratory"].includes(user.role)
      ) {
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

      if (notifications && notifications.length > 0) {
        notifications.forEach(async (notification) => {
          notification.isRead == true;
          await notification.save();
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

  async readNotifications(req, res) {
    try {
      const user = req.user;
      if (
        !user._id ||
        !["admin", "employee", "laboratory"].includes(user.role)
      ) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      const { notifications } = req.body;
      if (!notifications || !Array.isArray(notifications)) {
        return handlers.response.error({
          res,
          message: "Notifications must be an array",
        });
      }

      const updatedNotifications = await this.notification.updateMany(
        { isRead: false, _id: { $in: notifications }, receiverId: user._id },
        { isRead: true }
      );
      if (updatedNotifications.modifiedCount === 0) {
        return handlers.response.unavailable({
          res,
          message: "No notifications found to update",
        });
      }

      return handlers.response.success({
        res,
        message: "Notifications marked as read successfully",
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

        await this.notification.create({
          receiverId: user._id,
          type: "system",
          title: "Profile Updated",
          body: `You have successfully updated your profile.`,
          isRead: false,
        });

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
          jobRole,
          hireDate,
        } = req.body;

        if (
          !fullName ||
          !email ||
          !contactNumber ||
          !username ||
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
      } else if (user.role === "laboraotry") {
        const { fullName, email, contactNumber, address, username, about } =
          req.body;
        let { timings } = req.body;

        if (!fullName || !email || !contactNumber || !username || !address) {
          return handlers.response.error({
            res,
            message: "All fields are required",
          });
        }

        if (typeof timings === "string") {
          try {
            timings = JSON.parse(timings);
            console.log(typeof timings);
            console.log("Parsed timings:", timings);
          } catch (error) {
            return handlers.response.error({
              res,
              message: "Invalid JSON format for timings",
            });
          }
        }

        if (
          email &&
          !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
        ) {
          return handlers.response.error({
            res,
            message: "Invalid email format",
          });
        } else if (username && username.trim() === "") {
          return handlers.response.error({
            res,
            message: "Username is required",
          });
        } else if (fullName && fullName.trim() === "") {
          return handlers.response.error({
            res,
            message: "Fullname is required",
          });
        } else if (address && address.trim() === "") {
          return handlers.response.error({
            res,
            message: "Address is required",
          });
        } else if (
          isNaN(contactNumber) ||
          !/^\+?[1-9]\d{1,14}$/.test(contactNumber)
        ) {
          return handlers.response.error({
            res,
            message: "Invalid contact number format",
          });
        } else if (!Array.isArray(timings) || timings.length === 0) {
          return handlers.response.error({
            res,
            message: "Timings must be an array and cannot be empty",
          });
        } else if (about && about.trim().length < 10) {
          return handlers.response.error({
            res,
            message: "About section must be at least 10 character long",
          });
        }

        let image = user.image || null;
        if (req.files?.image?.[0]) {
          const file = req.files.image[0];
          const folder = file.uploadFolder;
          const filename = file.savedFilename;
          image = `uploads/${folder}/${filename}`.replace(/\\/g, "/");
        }

        const existingUser = await this.laboratory.findOne({
          $or: [
            { email: email.toLowerCase().trim() },
            { contactNumber: contactNumber.trim() },
            { username: username.trim().toLowerCase() },
          ],
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
        user.username = username;
        user.image = image;
        user.about = about;
        user.timings = timings;
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

      await this.notification.create({
        receiverId: user._id,
        type: "system",
        title: "Password Updated",
        body: `You have successfully updated your account password at ${new Date()}.`,
        isRead: false,
      });

      if (user.userFCMToken && user.isNotification) {
        await sendNotification({
          token: user.userFCMToken,
          title: "Password Updated",
          body: `You have successfully updated your account password at ${new Date()}.`,
          data: { type: "system" },
        });
      }

      await sendEmail(
        user.email,
        "Password Changed Successfully",
        "Your password has been changed successfully.",
        `<p>Dear ${user.fullName},</p>
         <p>Your password has been changed successfully.</p>`
      );

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

      const model =
        role === "admin"
          ? this.admin
          : role === "employee"
          ? this.employee
          : role === "laboratory"
          ? this.laboratory
          : handlers.response.unauthorized({ res, message: "Invalid role" });

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

      const model =
        role === "admin"
          ? this.admin
          : role === "employee"
          ? this.employee
          : role === "laboratory"
          ? this.laboratory
          : handlers.response.unauthorized({ res, message: "Invalid role" });

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

      const model =
        role === "admin"
          ? this.admin
          : role === "employee"
          ? this.employee
          : role === "laboratory"
          ? this.laboratory
          : handlers.response.unauthorized({ res, message: "Invalid role" });

      const user = await model.findById(userId);

      if (!user) {
        return handlers.response.unavailable({
          res,
          message: "User not found",
        });
      }

      if (user.userFCMToken && user.isNotification) {
        await sendNotification({
          token: user.userFCMToken,
          title: "Login Notification",
          body: `Hello ${user.fullName}, you have successfully logged in.`,
          data: { type: "alert" },
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.forgetPasswordOTP = null;
      await user.save();

      await this.notification.create({
        receiverId: user._id,
        type: "system",
        title: "Password Updated",
        body: `You have successfully updated your account password at ${new Date()}.`,
        isRead: false,
      });

      if (user.userFCMToken && user.isNotification) {
        await sendNotification({
          token: user.userFCMToken,
          title: "Password Updated",
          body: `You have successfully updated your account password at ${new Date()}.`,
          data: { type: "system" },
        });
      }

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
        message: "Password reset successfully",
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async generateFcmToken(req, res) {
    try {
      const user = req.user;
      if (!user._id) {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized User",
        });
      }

      const { fcmToken } = req.body;

      user.userFCMToken = fcmToken;
      await user.save();

      return handlers.response.success({
        res,
        message: "FCM token saved successfully",
        data: user.userFCMToken,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }
}

module.exports = new Service();
