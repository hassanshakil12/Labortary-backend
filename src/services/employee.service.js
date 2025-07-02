const { handlers } = require("../utils/handlers");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.appointment = require("../models/Appointment.model");
    this.notification = require("../models/Notification.model");
  }

  async getAppointments(req, res) {
    try {
      if (!req.user || req.user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const appointments = await this.appointment
        .find({
          employeeId: req.user._id,
        })
        .populate("employeeId");

      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointments retrieved successfully",
        data: appointments,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getAppointmentById(req, res) {
    try {
      if (!req.user || req.user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const { appointmentId } = req.params;

      const appointment = await this.appointment
        .find({
          _id: appointmentId,
          employeeId: req.user._id,
        })
        .populate("employeeId");

      if (!appointment) {
        return handlers.response.unavailable({
          res,
          message: "No appointment found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointment retrieved successfully",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async gerArchivedAppointments(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const archivedAppointments = await this.appointment
        .find({
          employeeId: user._id,
          status: "completed",
        })
        .populate("employeeId");

      if (!archivedAppointments) {
        return handlers.response.unavailable({
          res,
          message: "No archived appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Archived appointments retrieved successfully",
        data: archivedAppointments,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getTodayAppointments(req, res) {
    try {
      const user = req.user;

      if (!user._id || user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const appointments = await this.appointment.aggregate([
        {
          $match: {
            employeeId: new mongoose.Types.ObjectId(user._id),
            appointmentDateTime: {
              $gte: startOfToday,
              $lt: endOfToday,
            },
          },
        },
        {
          $addFields: {
            priorityOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priorityLevel", "urgent"] }, then: 1 },
                  { case: { $eq: ["$priorityLevel", "high"] }, then: 2 },
                  { case: { $eq: ["$priorityLevel", "medium"] }, then: 3 },
                  { case: { $eq: ["$priorityLevel", "low"] }, then: 4 },
                ],
                default: 5,
              },
            },
          },
        },
        {
          $sort: {
            priorityOrder: 1,
            appointmentDateTime: 1,
          },
        },
        {
          $lookup: {
            from: "employees", // collection name, not model name
            localField: "employeeId",
            foreignField: "_id",
            as: "employeeData",
          },
        },
        {
          $unwind: "$employeeData",
        },
      ]);

      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No appointments found for today",
        });
      }

      return handlers.response.success({
        res,
        message: "Today's appointments retrieved successfully",
        data: appointments,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getDashboard(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const employeeId = user._id;

      const [
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        totalFeesResult,
      ] = await Promise.all([
        this.appointment.countDocuments({ employeeId }),
        this.appointment.countDocuments({ employeeId, status: "completed" }),
        this.appointment.countDocuments({ employeeId, status: "pending" }),
        this.appointment.aggregate([
          {
            $match: {
              employeeId: new mongoose.Types.ObjectId(employeeId),
              isPaid: true,
            },
          },
          {
            $group: {
              _id: null,
              totalFees: { $sum: "$fees" },
            },
          },
        ]),
      ]);

      const totalFees = totalFeesResult[0]?.totalFees || 0;

      return handlers.response.success({
        res,
        message: "Dashboard data retrieved successfully",
        data: {
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          totalFees,
        },
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = req.user;
      if (!user || user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const employee = await this.employee.findById(user._id);
      if (!employee) {
        return handlers.response.unavailable({
          res,
          message: "Employee not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Employee profile retrieved successfully",
        data: employee,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }
}

module.exports = new Service();
