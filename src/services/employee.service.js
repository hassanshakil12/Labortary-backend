const { handlers } = require("../utils/handlers");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { sendNotification } = require("../utils/pushNotification");
const sendEmail = require("../config/nodemailer");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.appointment = require("../models/Appointment.model");
    this.notification = require("../models/Notification.model");
    this.laboratory = require("../models/Laboratory.model");
    this.admin = require("../models/Admin.model");
  }

  async getAppointments(req, res) {
    try {
      if (!req.user || req.user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const skip = (page - 1) * limit;

      const labortary = req.query.labortary || null;
      const sortOrder = req.query.sortOrder || -1;
      const sortFields = req.query.sortFields || "createdAt";
      const status = req.query.status || null;
      const priorityLevel = req.query.priorityLevel || null;
      const dateAndTime = req.query.dateAndTime || null;
      const tracking = req.query.tracking || null;

      // Validations
      if (tracking && !["True", "False"].includes(tracking)) {
        return handlers.response.error({
          res,
          message: "Invalid tracking status",
        });
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

      const total = await this.appointment.countDocuments();
      const appointments = await this.appointment
        .find({
          labortary: labortary ? labortary : { $exists: true },
          status: status ? status : { $exists: true },
          priorityLevel: priorityLevel ? priorityLevel : { $exists: true },
          ...dateFilter,
          employeeId: req.user._id,
          ...(tracking === "True"
            ? { trackingId: { $exists: true, $ne: null } }
            : tracking === "False"
            ? { $or: [{ trackingId: null }, { trackingId: "" }] }
            : {}),
        })
        .populate("employeeId")
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

      const page = parseInt(req.query.page) || 1;
      const limit = 15;
      const skip = (page - 1) * limit;

      const labortary = req.query.labortary || null;
      const sortOrder = req.query.sortOrder || -1;
      const sortFields = req.query.sortFields || "createdAt";
      const status = req.query.status || null;
      const priorityLevel = req.query.priorityLevel || null;
      const dateAndTime = req.query.dateAndTime || null;

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

      const total = await this.appointment.countDocuments();
      const query = {
        employeeId: user._id,
        ...(labortary && { labortary }),
        ...(priorityLevel && { priorityLevel }),
        ...(dateFilter || {}),
      };

      if (status) {
        query.status = status;
      } else {
        query.status = { $in: ["Completed", "Rejected"] };
      }

      const appointments = await this.appointment
        .find(query)
        .populate("employeeId")
        .skip(skip)
        .limit(limit)
        .sort({ [sortFields]: sortOrder > -1 ? 1 : -1 })
        .collation({ locale: "en", strength: 1, caseFirst: "off" });

      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No archived appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Archived appointments retrieved successfully",
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

  async uploadTrackingId(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const { appointmentId } = req.params;
      if (!appointmentId) {
        return handlers.response.error({
          res,
          message: "Appointment Id not found",
        });
      }

      const appointment = await this.appointment.findById(appointmentId);
      if (!appointment) {
        return handlers.response.unavailable({
          res,
          message: "Appointment not found",
        });
      }

      if (appointment && appointment.trackingId) {
        return handlers.response.error({
          res,
          message: "Tracking ID already exists for this appointment",
        });
      }

      let image;
      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        const folder = file.uploadFolder;
        const filename = file.savedFilename;
        image = `uploads/${folder}/${filename}`.replace(/\\/g, "/");
      }

      appointment.trackingId = image || appointment.trackingId;
      await appointment.save();

      const admin = await this.admin.findOne();
      if (!admin) {
        handlers.logger.unavailable({
          res,
          message: "Admin not found",
        });
      }

      await this.notification.create({
        receiverId: user._id,
        type: "system",
        title: "Uploaded Tracking Id",
        body: `You have successfully uploaded the tracking ID for appointment ID: ${appointment._id} of ${appointment.labortary}.`,
        isRead: false,
      });

      await this.notification.create({
        receiverId: admin._id,
        type: "system",
        title: "Uploaded Tracking Id",
        body: `${user.fullName} with Employee Id: ${user.employeeId} have successfully uploaded the tracking ID for appointment ID: ${appointment._id} of ${appointment.labortary}.`,
        isRead: false,
      });

      if (user.userFCMToken && user.isNotification) {
        await sendNotification({
          token: user.userFCMToken,
          title: "Uploaded Tracking Id",
          body: `You have successfully uploaded the tracking ID for appointment ID: ${appointment._id} of ${appointment.labortary}.`,
          data: { type: "system" },
        });
      }

      if (admin.userFCMToken && admin.isNotification) {
        await sendNotification({
          token: admin.userFCMToken,
          title: "Uploaded Tracking Id",
          body: `${user.fullName} with Employee Id: ${user.employeeId} have successfully uploaded the tracking ID for appointment ID: ${appointment._id} of ${appointment.labortary}.`,
          data: { type: "system" },
        });
      }

      await Promise.all([
        sendEmail(
          user.email,
          "Uploaded Tracking Id",
          "You have successfully uploaded the tracking ID for appointment ID: ${appointment._id} of ${appointment.labortary}."
        ),
        sendEmail(
          admin.email,
          "Uploaded Tracking Id",
          `${user.fullName} with Employee Id: ${user.employeeId} have successfully uploaded the tracking ID for appointment ID: ${appointment._id} of ${appointment.labortary}.`
        ),
      ]);

      return handlers.response.success({
        res,
        message: "Tracking Id uploaded successfully",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getLaboratories(req, res) {
    try {
      const user = req.user;
      if (!user || user.role !== "employee") {
        return handlers.response.unauthorized({
          res,
          message: "Only employees can access",
        });
      }

      const laboratories = await this.laboratory
        .find()
        .select("-password -__v -userAuthToken -forgotPasswordOTP")
        .sort({ createdAt: -1 });
      if (!laboratories || laboratories.length === 0) {
        return handlers.response.unavailable({
          res,
          message: "No laboratories found",
        });
      }

      return handlers.response.success({
        res,
        message: "Laboratories retrieved successfully",
        data: laboratories,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }
}

module.exports = new Service();
