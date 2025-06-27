const { handlers } = require("../utils/handlers");
const mongoose = require("mongoose");

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
}

module.exports = new Service();
