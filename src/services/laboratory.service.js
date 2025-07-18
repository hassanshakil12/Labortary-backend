const mongoose = require("mongoose");
const { handlers } = require("../utils/handlers");

class Service {
  constructor() {
    this.laboratory = require("../models/Laboratory.model");
    this.employee = require("../models/Employee.model");
    this.appointment = require("../models/Appointment.model");
    this.transaction = require("../models/Transaction.model");
  }

  async getAppointments(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only Laboratory can access",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const skip = (page - 1) * limit;

      const employeeId = req.query.employeeId || null;
      const sortOrder = req.query.sortOrder || -1;
      const sortFields = req.query.sortFields || "createdAt";
      const status = req.query.status || null;
      const priorityLevel = req.query.priorityLevel || null;
      const dateAndTime = req.query.dateAndTime || null;

      let employee = null;
      if (employeeId) {
        if (mongoose.Types.ObjectId.isValid(employeeId)) {
          employee = await this.employee.findById(employeeId);
          if (!employee) {
            return handlers.response.unavailable({
              res,
              message: "Employee not found",
            });
          }
        } else {
          return handlers.response.error({
            res,
            message: "Invalid employee ID format",
          });
        }
      }

      if (status && !["Pending", "Completed", "Rejected"].includes(status)) {
        return handlers.response.error({ res, message: "Invalid status" });
      }

      if (
        priorityLevel &&
        !["Urgent", "High", "Medium", "Low"].includes(priorityLevel)
      ) {
        return handlers.response.error({
          res,
          message: "Invalid Priority Level",
        });
      }

      let dateFilter = {};
      if (dateAndTime) {
        const inputDate = new Date(dateAndTime);

        const hasTime =
          inputDate.getUTCHours() > 0 ||
          inputDate.getUTCMinutes() > 0 ||
          inputDate.getUTCSeconds() > 0 ||
          inputDate.getUTCMilliseconds() > 0;

        if (hasTime) {
          // If time is present, match from that exact time onward
          dateFilter.appointmentDateTime = { $gte: inputDate };
        } else {
          // If only date is provided, match the whole day
          dateFilter.appointmentDateTime = {
            $gte: new Date(inputDate.setUTCHours(0, 0, 0, 0)),
            $lt: new Date(inputDate.setUTCHours(24, 0, 0, 0)),
          };
        }
      }

      const total = await this.appointment.countDocuments({
        labortary: user.fullName,
      });
      const appointments = await this.appointment
        .find({
          employeeId: employeeId ? employee._id : { $exists: true },
          status: status ? status : { $exists: true },
          priorityLevel: priorityLevel ? priorityLevel : { $exists: true },
          ...dateFilter,
          labortary: user.fullName,
        })
        .populate(
          "employeeId",
          "-password -userAuthToken -__v -forgotPasswordOTP"
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortFields]: sortOrder > -1 ? 1 : -1 })
        .collation({ locale: "en", strength: 1, caseFirst: "off" });

      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointments retrieved successfully",
        data: {
          totalAppointments: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
          appointments,
        },
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getAppointmentById(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only laboratory can access",
        });
      }

      const { appointmentId } = req.params;

      if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
        return handlers.response.error({
          res,
          message: "Invalid appointment Id",
        });
      }

      const appointment = await this.appointment
        .findOne({
          _id: appointmentId,
          labortary: user.fullName,
        })
        .populate(
          "employeeId",
          "-password -userAuthToken -__v -forgotPasswordOTP"
        );
      if (!appointment) {
        return handlers.response.unavailable({
          res,
          message: "Appointment not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointmet ftched successfully",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getArchivedAppointments(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only laboratory can access",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const skip = (page - 1) * limit;

      const employeeId = req.query.employeeId || null;
      const sortOrder = req.query.sortOrder || -1;
      const sortFields = req.query.sortFields || "createdAt";
      const status = req.query.status || null;
      const priorityLevel = req.query.priorityLevel || null;
      const dateAndTime = req.query.dateAndTime || null;

      let employee = null;
      if (employeeId) {
        if (mongoose.Types.ObjectId.isValid(employeeId)) {
          employee = await this.employee.findById(employeeId);
          if (!employee) {
            return handlers.response.unavailable({
              res,
              message: "Employee not found",
            });
          }
        } else {
          return handlers.response.error({
            res,
            message: "Invalid employee ID format",
          });
        }
      }

      if (status && !["Completed", "Rejected"].includes(status)) {
        return handlers.response.error({ res, message: "Invalid status" });
      }

      if (
        priorityLevel &&
        !["Urgent", "High", "Medium", "Low"].includes(priorityLevel)
      ) {
        return handlers.response.error({
          res,
          message: "Invalid Priority Level",
        });
      }

      let dateFilter = {};
      if (dateAndTime) {
        const inputDate = new Date(dateAndTime);

        const hasTime =
          inputDate.getUTCHours() > 0 ||
          inputDate.getUTCMinutes() > 0 ||
          inputDate.getUTCSeconds() > 0 ||
          inputDate.getUTCMilliseconds() > 0;

        if (hasTime) {
          // If time is present, match from that exact time onward
          dateFilter.appointmentDateTime = { $gte: inputDate };
        } else {
          // If only date is provided, match the whole day
          dateFilter.appointmentDateTime = {
            $gte: new Date(inputDate.setUTCHours(0, 0, 0, 0)),
            $lt: new Date(inputDate.setUTCHours(24, 0, 0, 0)),
          };
        }
      }

      const total = await this.appointment.countDocuments({
        labortary: user.fullName,
        status: { $in: ["Completed", "Rejected"] },
      });
      const appointments = await this.appointment
        .find({
          employeeId: employeeId ? employee._id : { $exists: true },
          status: status ? status : { $in: ["Completed", "Rejected"] },
          priorityLevel: priorityLevel ? priorityLevel : { $exists: true },
          ...dateFilter,
          labortary: user.fullName,
        })
        .populate(
          "employeeId",
          "-password -userAuthToken -__v -forgotPasswordOTP"
        )
        .skip(skip)
        .limit(limit)
        .sort({ [sortFields]: sortOrder > -1 ? 1 : -1 })
        .collation({ locale: "en", strength: 1, caseFirst: "off" });

      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointments retrieved successfully",
        data: {
          totalAppointments: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
          appointments,
        },
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getArchivedAppointmentById(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only laboratory can access",
        });
      }

      const { appointmentId } = req.params;
      if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
        return handlers.response.error({
          res,
          message: "Invalid appointment Id",
        });
      }

      const appointment = await this.appointment
        .findOne({
          _id: appointmentId,
          labortary: user.fullName,
        })
        .populate(
          "employeeId",
          "-password -userAuthToken -__v -forgotPasswordOTP"
        );
      if (!appointment) {
        return handlers.response.unavailable({
          res,
          message: "Appointment not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointment fetched successfully",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getTodayAppointments(req, res) {
    try {
      const user = req.user;

      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only laboratory can access",
        });
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const appointments = await this.laboratory.aggregate([
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
                  { case: { $eq: ["$priorityLevel", "Urgent"] }, then: 1 },
                  { case: { $eq: ["$priorityLevel", "High"] }, then: 2 },
                  { case: { $eq: ["$priorityLevel", "Medium"] }, then: 3 },
                  { case: { $eq: ["$priorityLevel", "Low"] }, then: 4 },
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
            from: "laboratories", // collection name, not model name
            localField: "laboratoryId",
            foreignField: "_id",
            as: "laboratoryData",
          },
        },
        {
          $unwind: "$laboratoryData",
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

  async getProfile(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only laboratory can access",
        });
      }

      const laboratory = await this.laboratory
        .findOne({
          _id: user._id,
          role: user.role,
          userAuthToken: user.userAuthToken,
        })
        .select("-password -userAuthToken -__v -forgotPasswordOTP");

      if (!laboratory) {
        return handlers.response.unavailable({
          res,
          message: "Labratory not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Laboratory profile fetched successfully",
        data: laboratory,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getDashboard(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "laboratory") {
        return handlers.response.unauthorized({
          res,
          message: "Only laboratory can access",
        });
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Generate last 5 weekly ranges
      const weeks = [];
      for (let i = 4; i >= 0; i--) {
        const end = new Date();
        end.setDate(end.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);

        weeks.push({
          label: `Week ${5 - i} (${start.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${end.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })})`,
          start,
          end,
        });
      }

      const Appointment = this.appointment;

      // === METRICS for current lab (this month only) ===
      const [
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        rejectedAppointments,
        totalEarnings,
      ] = await Promise.all([
        Appointment.countDocuments({
          laboratoryId: user._id,
          createdAt: {
            $gte: new Date(currentYear, currentMonth, 1),
            $lt: new Date(currentYear, currentMonth + 1, 1),
          },
        }),
        Appointment.countDocuments({
          laboratoryId: user._id,
          labortary: user.fullName,
          status: "Pending",
        }),
        Appointment.countDocuments({
          laboratoryId: user._id,
          labortary: user.fullName,
          status: "Completed",
        }),
        Appointment.countDocuments({
          laboratoryId: user._id,
          labortary: user.fullName,
          status: "Rejected",
        }),
        this.transaction.aggregate([
          {
            $match: {
              laboratoryId: user._id,
              status: "Completed",
              createdAt: {
                $gte: new Date(currentYear, currentMonth, 1),
                $lt: new Date(currentYear, currentMonth + 1, 1),
              },
            },
          },
          {
            $group: {
              _id: null,
              totalEarnings: { $sum: "$amount" },
            },
          },
        ]),
      ]);

      // === Weekly Appointments for current lab ===
      const currentLabWeeklyAppointments = await Promise.all(
        weeks.map(async (week) => {
          const count = await Appointment.countDocuments({
            laboratoryId: user._id,
            labortary: user.fullName,
            createdAt: { $gte: week.start, $lte: week.end },
          });
          return {
            week: week.label,
            appointmentCount: count,
          };
        })
      );

      // === Get Top 2 Labs by total appointments (any time) ===
      const topLabs = await Appointment.aggregate([
        {
          $group: {
            _id: "$laboratoryId",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 2 },
      ]);

      const Laboratory = this.laboratory;

      // === Get weekly data for top 2 labs ===
      const topLaboratories = await Promise.all(
        topLabs.map(async (lab) => {
          const labInfo = await Laboratory.findById(lab._id).select(
            "_id fulName"
          );
          if (!labInfo) return null;
          if (labInfo._id.toString() === user._id.toString()) return null;

          const weeklyData = await Promise.all(
            weeks.map(async (week) => {
              const count = await Appointment.countDocuments({
                laboratoryId: lab._id,
                createdAt: { $gte: week.start, $lte: week.end },
              });
              return {
                week: week.label,
                appointmentCount: count,
              };
            })
          );

          return {
            laboratoryId: labInfo._id,
            labortary: labInfo.fulName,
            weeklyAppointments: weeklyData,
          };
        })
      );

      const filteredTopLaboratories = topLaboratories.filter(Boolean);

      return handlers.response.success({
        res,
        message: "Dashboard data fetched successfully",
        data: {
          metrics: {
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            rejectedAppointments,
            totalEarnings: totalEarnings[0]?.totalEarnings || 0,
          },
          weeklyAppointments: {
            currentLaboratory: currentLabWeeklyAppointments,
            topLaboratories: filteredTopLaboratories,
          },
        },
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }
}

module.exports = new Service();
