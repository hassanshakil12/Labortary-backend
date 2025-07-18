const { handlers } = require("../utils/handlers");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");
const mongoose = require("mongoose");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.admin = require("../models/Admin.model");
    this.appointment = require("../models/Appointment.model");
    this.notification = require("../models/Notification.model");
    this.transaction = require("../models/Transaction.model");
    this.laboratory = require("../models/Laboratory.model");
  }

  async addEmployee(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access",
        });
      }

      const {
        fullName,
        email,
        contactNumber,
        address,
        employeeId,
        username,
        password,
        jobRole,
        shiftTiming,
        about,
        gender,
        department,
      } = req.body;
      const hireDate = new Date(req.body.hireDate);

      if (
        !fullName ||
        !email ||
        !contactNumber ||
        !address ||
        !hireDate ||
        !employeeId ||
        !username ||
        !password ||
        !jobRole ||
        !department ||
        !gender ||
        !shiftTiming
      ) {
        return handlers.response.error({
          res,
          message: "All fields are required",
        });
      }

      if (
        !["Laboratory", "Radiology", "Pharmacy", "Admin"].includes(department)
      ) {
        return handlers.response.error({ res, message: "Invalid department" });
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return handlers.response.error({
          res,
          message: "Invalid email format",
        });
      } else if (!/^\+?[1-9]\d{1,14}$/.test(contactNumber)) {
        return handlers.response.error({
          res,
          message: "Invalid Contact Number format",
        });
      } else if (address.trim().length < 5) {
        return handlers.response.error({
          res,
          message: "Address must be at least 5 characters long",
        });
      } else if (isNaN(hireDate.getTime()) || hireDate > new Date()) {
        return handlers.response.error({
          res,
          message: "Invalid hire date",
        });
      } else if (!["Male", "Female", "Other"].includes(gender)) {
        return handlers.response.error({ res, message: "Invalid gender" });
      } else if (password.trim().length < 8) {
        return handlers.response.error({
          res,
          message: "Password must be at least 8 characters long",
        });
      }

      const existingEmployee = await this.employee.findOne({
        $or: [
          { email: email.toLowerCase().trim() },
          { employeeId: employeeId.trim().toUpperCase() },
          { username: username.toLowerCase().trim() },
          { contactNumber: contactNumber.trim() },
        ],
      });

      if (existingEmployee) {
        return handlers.response.error({
          res,
          message: "Employee already exists",
        });
      }

      let image = null;
      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        const folder = file.uploadFolder;
        const filename = file.savedFilename;
        image = `uploads/${folder}/${filename}`.replace(/\\/g, "/");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      if (!hashedPassword) {
        return handlers.response.error({
          res,
          message: "Failed to hash password",
        });
      }

      const employee = await this.employee.create({
        fullName,
        email: email.toLowerCase(),
        contactNumber,
        address,
        hireDate: new Date(hireDate),
        employeeId,
        username,
        password: hashedPassword,
        jobRole,
        shiftTiming,
        about,
        image,
        gender,
        department,
      });

      if (!employee) {
        return handlers.response.error({
          res,
          message: "Failed to add employee",
        });
      }

      if (req.user.isNotification) {
        await this.notification.create({
          receiverId: req.user._id,
          AdminId: req.user._id,
          type: "system",
          title: "New Employee Added",
          body: `New employee ${employee.fullName} has been added to All Mobile Phlebotomy Services.`,
          isRead: false,
        });
      }

      await Promise.all([
        sendEmail(
          req.user.email,
          "New Employee Added",
          `New Employees Just added to All Mobile Phlebotomy Services.`,
          `
          <h3>New Employee Added</h3>
          <p><strong>Name:</strong> ${employee.fullName}</p>
          <p><strong>Email:</strong> ${employee.email}</p>
          <p><strong>Contact:</strong> ${employee.contactNumber}</p>
          <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
          <p><strong>Role:</strong> ${employee.jobRole}</p>
        `
        ),
        sendEmail(
          employee.email,
          "Welcome to All Mobile Phlebotomy Services.",
          `You are added as an employee`,
          `<p>You have been successfully registered as an employee at All Mobile Phlebotomy Services..</p>`
        ),
      ]);

      return handlers.response.success({
        res,
        message: "Employee added successfully",
        data: employee,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getEmployees(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access",
        });
      }

      const employees = await this.employee.find();

      if (!employees) {
        return handlers.response.error({
          res,
          message: "Failed to fetch employees",
        });
      }

      return handlers.response.success({
        res,
        message: "Employees fetched successfully",
        data: employees,
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
      if (!req.user || req.user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access",
        });
      }

      let admin = await this.admin.find();
      if (!admin) {
        return handlers.response.error({
          res,
          message: "Failed to fetch admin profile",
        });
      }

      admin = admin[0];

      return handlers.response.success({
        res,
        message: "Admin profile fetched successfully",
        data: admin,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async createAppointment(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access",
        });
      }

      const {
        patientName,
        email,
        contactNumber,
        address,
        gender,
        employeeId,
        labortary,
        laboratoryId,
        fees,
        priorityLevel,
        status,
        specialInstructions,
        accountNumber,
        age,
      } = req.body;
      const appointmentDateTime = new Date(req.body.appointmentDateTime);
      const dateOfBirth = new Date(req.body.dateOfBirth);

      if (
        !patientName ||
        !email ||
        !contactNumber ||
        !address ||
        !dateOfBirth ||
        !appointmentDateTime ||
        !employeeId ||
        !labortary ||
        !age
      ) {
        return handlers.response.error({
          res,
          message: "Required fields are missing.",
        });
      }

      if (laboratoryId && !mongoose.Types.ObjectId.isValid(laboratoryId)) {
        return handlers.response.error({
          res,
          message: "Invalid Laboratory Id",
        });
      }

      // Validate user inputs
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return handlers.response.error({
          res,
          message: "Invalid email format.",
        });
      } else if (!/^\+?[1-9]\d{1,14}$/.test(contactNumber)) {
        return handlers.response.error({
          res,
          message: "Invalid contact number format.",
        });
      } else if (isNaN(appointmentDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid or past appointment date/time",
        });
      } else if (isNaN(age) || age < 0) {
        return handlers.response.error({
          res,
          message: "Invalid age. Age must be a number.",
        });
      } else if (address && address.trim().length < 5) {
        return handlers.response.error({
          res,
          message: "Address must be at least 5 characters long.",
        });
      } else if (!["Urgent", "High", "Medium", "Low"].includes(priorityLevel)) {
        return handlers.response.error({
          res,
          message:
            "Invalid Priority Level. Allowed values are: Urgent, High, Medium, Low",
        });
      } else if (!["Pending", "Completed", "Rejected"].includes(status)) {
        return handlers.response.error({
          res,
          message:
            "Invalid Status. Allowed values are: Pending, Completed, Rejected",
        });
      } else if (
        !(dateOfBirth instanceof Date) ||
        isNaN(dateOfBirth.getTime()) ||
        dateOfBirth > new Date()
      ) {
        return handlers.response.error({
          res,
          message: "Invalid date of birth.",
        });
      } else if (labortary.trim().length === 0) {
        return handlers.response.error({
          res,
          message: "Laboratory name is required.",
        });
      } else if (fees) {
        if (isNaN(fees) || fees < 0) {
          return handlers.response.error({
            res,
            message: "Invalid fees. Fees must be a non-negative number.",
          });
        }
      } else if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return handlers.response.error({
          res,
          message: "Invalid employee Id",
        });
      } else if (
        fees > 0 &&
        (!accountNumber || !/^\d{10}$/.test(accountNumber))
      ) {
        return handlers.response.error({
          res,
          message:
            "Account number is required and must be a 10-digit string when fees > 0",
        });
      }

      const employee = await this.employee.findOne({ employeeId });
      if (!employee) {
        return handlers.response.unavailable({
          res,
          message: "Employee not found.",
        });
      }

      let laboratory = null;
      if (laboratoryId) {
        laboratory = await this.laboratory.findById(laboratoryId);
        if (!laboratory) {
          return handlers.response.unavailable({
            res,
            message: "Laboratory not found.",
          });
        }
      }

      let image = null;
      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        const folder = file.uploadFolder;
        const filename = file.savedFilename;
        image = `uploads/${folder}/${filename}`.replace(/\\/g, "/");
      }

      let documents = [];
      if (req.files?.documents?.length > 0) {
        documents = req.files.documents.map((file) => {
          const folder = file.uploadFolder;
          const filename = file.savedFilename;
          return `uploads/${folder}/${filename}`.replace(/\\/g, "/");
        });
      }
      const appointment = await this.appointment.create({
        image,
        patientName: patientName,
        email: email.toLowerCase(),
        contactNumber,
        address,
        dateOfBirth,
        gender,
        employeeId: employee._id,
        labortary: laboratory ? laboratory.fullName : labortary,
        laboratoryId: laboratoryId ? laboratory._id : null,
        fees,
        priorityLevel,
        appointmentDateTime: new Date(appointmentDateTime),
        status,
        specialInstructions: specialInstructions.trim(),
        documents,
        age,
        accountNumber,
      });

      const transaction = await this.transaction.create({
        appointmentId: appointment._id,
        laboratoryId: laboratoryId ? laboratory._id : null,
        accountNumber,
        patientName,
        dateAndTime: new Date(appointmentDateTime),
        amount: fees,
      });
      if (!transaction) {
        return handlers.response.error({
          res,
          message: "Failed to create transaction.",
        });
      }

      if (appointment) {
        if (employee.isNotification) {
          await this.notification.create({
            receiverId: employee._id,
            AdminId: req.user._id,
            type: "appointment",
            title: "New Appointment",
            body: `New appointment created for ${
              laboratoryId ? laboratory.fullName : labortary
            } of ${patientName} at ${appointmentDateTime}`,
            isRead: false,
          });
        }

        await Promise.all([
          sendEmail(
            req.user.email,
            "New Appointment Created",
            `New Appointment Just Added to the system`
          ),
          sendEmail(
            email,
            "New Appointment",
            `You appointment for ${
              laboratoryId ? laboratory.fullName : labortary
            } has been created at All Mobile Phlebotomy Services.`
          ),
          sendEmail(
            employee.email,
            "New Appointment",
            `A new patient ${patientName} has been assigned to you for an appointment of ${
              laboratoryId ? laboratory.fullName : labortary
            } at ${appointmentDateTime}. Please check your dashboard for details.`
          ),
        ]);
      }

      return handlers.response.success({
        res,
        message: "Appointment created successfully.",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getAppointments(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access",
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
      const employeeId = req.query.employeeId || null;

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

      let employee = null;
      if (employeeId) {
        employee = await this.employee.findOne({ employeeId });
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
          employeeId: employee ? employee._id : { $exists: true },
        })
        .populate("employeeId")
        .skip(skip)
        .limit(limit)
        .sort({ [sortFields]: sortOrder > -1 ? 1 : -1 })
        .collation({ locale: "en", strength: 1, caseFirst: "off" });

      return handlers.response.success({
        res,
        message: "Appointments fetched successfully.",
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
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getAppointmentById(req, res) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Unauthorized access",
        });
      }

      const { appointmentId } = req.params;

      const appointment = await this.appointment
        .findById(appointmentId)
        .populate("employeeId");

      if (!appointment) {
        return handlers.response.error({
          res,
          message: "No appointment found.",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointment fetched successfully.",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async updateAppointmentStatus(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const { appointmentId } = req.params;
      const { status } = req.body;

      if (!appointmentId) {
        return handlers.response.error({
          res,
          message: "Appointment ID is required",
        });
      }

      if (!["completed", "pending", "rejected"].includes(status)) {
        return handlers.response.error({
          res,
          message:
            "Invalid status. Allowed values are: completed, pending, rejected",
        });
      }

      const appointment = await this.appointment.findByIdAndUpdate(
        appointmentId,
        { status },
        { new: true }
      );
      if (!appointment) {
        return handlers.response.unavailable({
          res,
          message: "Appointment not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointment updated successfully",
        data: appointment,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getArchivedAppointments(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
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
      const employeeId = req.query.employeeId || null;

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

      let employee = null;
      if (employeeId) {
        employee = await this.employee.findOne({ employeeId });
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

      let statusCondition = status
        ? { status }
        : { status: { $in: ["Completed", "Rejected"] } };

      if (status) {
        statusCondition = status;
      } else {
        statusCondition = { $in: ["Completed", "Rejected"] };
      }

      const total = await this.appointment.countDocuments();
      const appointments = await this.appointment
        .find({
          status: statusCondition,
          labortary: labortary ? labortary : { $exists: true },
          priorityLevel: priorityLevel ? priorityLevel : { $exists: true },
          ...dateFilter,
          employeeId: employee ? employee._id : { $exists: true },
        })
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
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getScheduledAppointments(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const appointments = await this.appointment.find({
        status: "pending",
      });
      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No scheduled appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Scheduled appointments retrieved successfully",
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

  async getTodayAppointments(req, res) {
    try {
      const user = req.user;

      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const appointments = await this.appointment.aggregate([
        {
          $match: {
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
                default: 5, // fallback if undefined
              },
            },
          },
        },
        {
          $sort: {
            priorityOrder: 1, // High -> Medium -> Low
            appointmentDateTime: 1, // Then sort by time
          },
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

  async getEmployees(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const employees = await this.employee.find().select("-password");
      if (!employees) {
        return handlers.response.unavailable({
          res,
          message: "Employees not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Employees retrieved successfully",
        data: employees,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getEmployeeById(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const { employeeId } = req.params;

      const employee = await this.employee
        .findById(employeeId)
        .select("-password");
      if (!employee) {
        return handlers.response.unavailable({
          res,
          message: "Employee not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Employee retrieved successfully",
        data: employee,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getActiveEmployees(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const employees = await this.employee
        .find({ isActive: true })
        .select("-password");
      if (!employees) {
        return handlers.response.unavailable({
          res,
          message: "No active employees found",
        });
      }

      return handlers.response.success({
        res,
        message: "Active employees retrieved successfully",
        data: employees,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async deleteEmployee(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const { employeeId } = req.params;
      if (!employeeId) {
        return handlers.response.error({
          res,
          message: "Employee ID is required",
        });
      }

      const employee = await this.employee.findByIdAndDelete(employeeId);
      if (!employee) {
        return handlers.response.unavailable({
          res,
          message: "Employee not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Employee deleted successfully",
        data: employee,
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
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const [
        totalEmployees,
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        rejectedAppointments,
        paidAppointments,
      ] = await Promise.all([
        this.employee.countDocuments(),
        this.appointment.countDocuments(),
        this.appointment.countDocuments({ status: "completed" }),
        this.appointment.countDocuments({ status: "pending" }),
        this.appointment.countDocuments({ status: "rejected" }),
        this.appointment.countDocuments({ isPaid: true }),
      ]);

      return handlers.response.success({
        res,
        message: "Dashboard data retrieved successfully",
        data: {
          totalEmployees,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          rejectedAppointments,
          paidAppointments,
        },
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getTransactions(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const transactions = await this.transaction
        .find()
        .populate("appointmentId")
        .sort({ createdAt: -1 });

      if (!transactions) {
        return handlers.response.unavailable({
          res,
          message: "No transactions found",
        });
      }

      return handlers.response.success({
        res,
        message: "Transactions retrieved successfully",
        data: transactions,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async updateTransactionStatus(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const { transactionId } = req.params;
      const { status } = req.body;

      if (!transactionId) {
        return handlers.response.error({
          res,
          message: "Transaction ID is required",
        });
      }

      if (!["Pending", "Completed", "Denied"].includes(status)) {
        return handlers.response.error({
          res,
          message:
            "Invalid status. Allowed values are: Pending, Completed, Denied",
        });
      }

      const transaction = await this.transaction.findByIdAndUpdate(
        transactionId,
        { status },
        { new: true }
      );
      if (!transaction) {
        return handlers.response.unavailable({
          res,
          message: "Transaction not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Transaction updated successfully",
        data: transaction,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getRecentTransaction(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const transaction = await this.transaction
        .find({ status: "Completed" })
        .sort({ createdAt: -1 })
        .limit(1);

      if (!transaction) {
        return handlers.response.unavailable({
          res,
          message: "No recent transactions found",
        });
      }

      return handlers.response.success({
        res,
        message: "Recent transaction retrieved successfully",
        data: transaction,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async getTotalEarningsOfCurrentMonth(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setHours(23, 59, 59, 999);

      const totalEarnings = await this.transaction.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
            status: "Completed",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      if (!totalEarnings) {
        return handlers.response.unavailable({
          res,
          message: "No earnings found for the current month",
        });
      }

      const earnings = totalEarnings[0]?.totalAmount || 0;

      return handlers.response.success({
        res,
        message: "Total earnings of the current month retrieved successfully",
        data: earnings,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({
        res,
        message: error.message,
      });
    }
  }

  async createLaboratory(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const {
        email,
        username,
        password,
        fullName,
        address,
        contactNumber,
        about,
      } = req.body;

      let { timings } = req.body;

      if (
        !email ||
        !username ||
        !password ||
        !fullName ||
        !address ||
        !contactNumber ||
        !timings ||
        !about
      ) {
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

      // Validating the input data
      if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return handlers.response.error({
          res,
          message: "Invalid email format",
        });
      } else if (username && username.trim() === "") {
        return handlers.response.error({
          res,
          message: "Username is required",
        });
      } else if (password && password.trim().length < 8) {
        return handlers.response.error({
          res,
          message: "Password must be at least 8 characters long",
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

      const hashedPassword = await bcrypt.hash(password, 10);
      if (!hashedPassword) {
        return handlers.response.error({
          res,
          message: "Failed to hash password",
        });
      }

      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      for (const entry of timings) {
        if (
          !entry.day ||
          !validDays.includes(entry.day) ||
          !("time" in entry) ||
          (entry.time !== null &&
            (!Array.isArray(entry.time) ||
              !entry.time.every(
                (t) =>
                  t === null ||
                  (!isNaN(Date.parse(t)) &&
                    new Date(t).toISOString() === new Date(t).toISOString())
              )))
        ) {
          return handlers.response.error({
            res,
            message: `Invalid timing entry for day: ${entry.day || "Unknown"}`,
          });
        }
      }

      // Handling image file uploading
      let image = null;
      console.log("req.files:", req.files);

      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        if (file.uploadFolder && file.savedFilename) {
          image = `uploads/${file.uploadFolder}/${file.savedFilename}`.replace(
            /\\/g,
            "/"
          );
        } else {
          handlers.logger.error({
            message: "Image file is missing 'uploadFolder' or 'savedFilename'.",
          });
        }
      }

      // Verifying the uniqueness of input data
      let existingUser = await this.laboratory.findOne({
        $or: [
          { email: email.toLowerCase().trim() },
          { username: username.toLowerCase().trim() },
          { contactNumber: contactNumber.trim().toString() },
        ],
      });

      if (!existingUser) {
        existingUser = await this.employee.findOne({
          $or: [
            { email: email.toLowerCase().trim() },
            { username: username.toLowerCase().trim() },
            { contactNumber: contactNumber.trim().toString() },
          ],
        });
      }

      if (!existingUser) {
        existingUser = await this.admin.findOne({
          $or: [
            { email: email.toLowerCase().trim() },
            { username: username.toLowerCase().trim() },
            { contactNumber: contactNumber.trim().toString() },
          ],
        });
      }

      if (existingUser) {
        return handlers.response.error({
          res,
          message: "Email, username, or contact number already exists",
        });
      }

      // Creating the laboratory with cleaned and validated data
      const newLaboratory = await this.laboratory.create({
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        image,
        fullName: fullName.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim().toString(),
        timings,
        about: about.trim().toString(),
      });

      // Sending notifications and emails after successful creation of the laboratory
      if (newLaboratory) {
        if (user.isNotification) {
          await this.notification.create({
            receiverId: user._id,
            AdminId: user._id,
            type: "system",
            title: "New Laboratory Added",
            body: `New Laboratory "${newLaboratory.fullName}" has been added to the system.`,
            isRead: false,
          });
        }

        if (newLaboratory.isNotification) {
          await this.notification.create({
            receiverId: newLaboratory._id,
            AdminId: user._id,
            type: "system",
            title: "Welcome to All Mobile Phlebotomy Services",
            body: `You have been successfully registered as a laboratory at All Mobile Phlebotomy Services.`,
            isRead: false,
          });
        }

        await Promise.all([
          sendEmail(
            user.email,
            "New Laboratory Added",
            `${newLaboratory.fullName} Just added to the system`,
            `
          <h3>New Employee Added</h3>
          <p><strong>Name:</strong> ${newLaboratory.fullName}</p>
          <p><strong>Email:</strong> ${newLaboratory.email}</p>
          <p><strong>Contact:</strong> ${newLaboratory.contactNumber}</p>
          <p><strong>Address:</strong> ${newLaboratory.address}</p>
          <p><strong>Role:</strong> ${newLaboratory.role}</p>
        `
          ),
          sendEmail(
            newLaboratory.email,
            "Welcome to All Mobile Phlebotomy Services",
            `You are added as a Laboratory`,
            `<p>You have been successfully registered as a laboratory at All Mobile Phlebotomy Services.</p>`
          ),
        ]);
      }

      return handlers.response.success({
        res,
        message: "Laboratory created successfully",
        data: newLaboratory,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async getLaboratories(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const laboratories = await this.laboratory
        .find()
        .select("-password -userAuthToken -forgetPasswordOTP -__v")
        .sort({ createdAt: -1 });

      if (!laboratories) {
        return handlers.response.unavailable({
          res,
          message: "No Laboratories found",
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

  async getLaboratoryById(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const { laboratoryId } = req.params;

      if (!laboratoryId || !mongoose.Types.ObjectId.isValid(laboratoryId)) {
        return handlers.response.error({
          res,
          message: "Invalid Laboratory Id",
        });
      }

      const laboratory = await this.laboratory
        .findById(laboratoryId)
        .select("-password -userAuthToken -forgetPasswordOTP -__v");

      if (!laboratory) {
        return handlers.response.unavailable({
          res,
          message: "Laboratory not found",
        });
      }

      return handlers.response.success({
        res,
        message: "Laboratory retrieved successfully",
        data: laboratory,
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }

  async deleteLaboratory(req, res) {
    try {
      const user = req.user;
      if (!user._id || user.role !== "admin") {
        return handlers.response.unauthorized({
          res,
          message: "Only admin can access",
        });
      }

      const { laboratoryId } = req.params;
      if (!laboratoryId || !mongoose.Types.ObjectId.isValid(laboratoryId)) {
        return handlers.response.error({
          res,
          message: "Invalid Laboratory Id",
        });
      }

      const laboratory = await this.laboratory.findOneAndDelete({
        _id: laboratoryId,
        role: "laboratory",
      });
      if (!laboratory) {
        return handlers.response.unavailable({
          res,
          message: "Failed to find laboratory or laboratory not found",
        });
      }

      if (laboratory) {
        await this.notification.create({
          receiverId: user._id,
          AdminId: user._id,
          type: "system",
          title: "Laboratory Deleted",
          body: `A laboratory "${laboratory.fullName}" has been deleted from the system.`,
          isRead: false,
        });

        await Promise.all([
          sendEmail(
            user.email,
            "Laboratory Deleted from System",
            `Laboratory ${laboratory.fullName} has been deleted`,
            `
          <h3>Laboratory Deleted</h3>
          <p><strong>Name:</strong> ${laboratory.fullName}</p>
          <p><strong>Email:</strong> ${laboratory.email}</p>
          <p><strong>Contact:</strong> ${laboratory.contactNumber}</p>
          <p><strong>Address:</strong> ${laboratory.address}</p>
        `
          ),
          sendEmail(
            laboratory.email,
            "Removed from All Mobile Phlebotomy Services.",
            `You are deleted from All Mobile Phlebotomy Services`,
            `<p>${laboratory.fullName} has been deleted from All Mobile Phlebotomy Services.</p>`
          ),
        ]);
      }

      return handlers.response.success({
        res,
        message: "Laboratory deleted successfully",
      });
    } catch (error) {
      handlers.logger.failed({ message: error.message });
      return handlers.response.failed({ res, message: error.message });
    }
  }
}

module.exports = new Service();
