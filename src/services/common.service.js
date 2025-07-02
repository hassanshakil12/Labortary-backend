const { handlers } = require("../utils/handlers");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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

      const notifications = await this.notification.find({
        receiverId: user._id,
      });
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
}

module.exports = new Service();
