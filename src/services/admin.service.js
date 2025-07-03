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
        hireDate,
        employeeId,
        username,
        password,
        jobRole,
        shiftTiming,
        about,
        gender,
        department,
      } = req.body;

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
        !gender
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
      }

      const existingEmployee = await this.employee.findOne({
        $or: [{ email }, { employeeId }, { username }, { contactNumber }],
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

      const employee = await this.employee.create({
        fullName,
        email,
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
          body: `New employee ${employee.fullName} has been added to the system.`,
          isRead: false,
        });
      }

      await Promise.all([
        sendEmail(
          req.user.email,
          "New Employee Added",
          `New Employees Just added to the system`,
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
          "Welcome to XYZ Laboratories",
          `You are added as an employee`,
          `<p>You have been successfully registered as an employee at XYZ Laboratories.</p>`
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
        dateOfBirth,
        gender,
        employeeId,
        labortary,
        fees,
        priorityLevel,
        appointmentDateTime,
        status,
        specialInstructions,
        accountNumber,
      } = req.body;

      if (
        !patientName ||
        !email ||
        !contactNumber ||
        !appointmentDateTime ||
        !employeeId ||
        !labortary ||
        !accountNumber
      ) {
        return handlers.response.error({
          res,
          message: "Required fields are missing.",
        });
      }

      const employee = await this.employee.findOne({ employeeId });
      if (!employee) {
        return handlers.response.unavailable({
          res,
          message: "Employee not found.",
        });
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
        patientName,
        email,
        contactNumber,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        employeeId: employee._id, // reference
        labortary,
        fees,
        priorityLevel,
        appointmentDateTime: new Date(appointmentDateTime),
        status,
        specialInstructions,
        documents,
      });

      const transaction = await this.transaction.create({
        appointmentId: appointment._id,
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

      if (employee.isNotification) {
        await this.notification.create({
          receiverId: employee._id,
          AdminId: req.user._id,
          type: "appointment",
          title: "New Appointment",
          body: `New appointment created for ${patientName} at ${appointmentDateTime}`,
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
          `You appointment for ${labortary} has been created at xyz labortaories`
        ),
        sendEmail(
          employee.email,
          "New Appointment",
          `A new patient has been assigned to you for an appointment`
        ),
      ]);

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

      const appointments = await this.appointment.find().populate("employeeId");

      if (!appointments) {
        return handlers.response.error({
          res,
          message: "No appointments found.",
        });
      }

      return handlers.response.success({
        res,
        message: "Appointments fetched successfully.",
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

      const appointments = await this.appointment
        .find({
          $or: [{ status: "completed" }, { status: "rejected" }],
        })
        .populate("employeeId");

      if (!appointments) {
        return handlers.response.unavailable({
          res,
          message: "No archived appointments found",
        });
      }

      return handlers.response.success({
        res,
        message: "Archived appointments retrieved successfully",
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
                  { case: { $eq: ["$priorityLevel", "urgent"] }, then: 1 },
                  { case: { $eq: ["$priorityLevel", "high"] }, then: 2 },
                  { case: { $eq: ["$priorityLevel", "medium"] }, then: 3 },
                  { case: { $eq: ["$priorityLevel", "low"] }, then: 4 },
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
        .find({
          $or: [{ status: "Denied" }, { status: "Completed" }],
        })
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
            dateAndTime: {
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

      return handlers.response.success({
        res,
        message: "Total earnings of the current month retrieved successfully",
        data: totalEarnings[0].totalAmount,
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
