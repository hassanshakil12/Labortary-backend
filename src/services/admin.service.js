const { handlers } = require("../utils/handlers");
const bcrypt = require("bcrypt");
const sendEmail = require("../config/nodemailer");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.admin = require("../models/Admin.model");
    this.appointment = require("../models/Appointment.model");
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
        hireDate,
        employeeId,
        username,
        password,
        jobRole,
        shiftTiming,
        about,
      } = req.body;

      if (
        !fullName ||
        !email ||
        !contactNumber ||
        !hireDate ||
        !employeeId ||
        !username ||
        !password ||
        !jobRole
      ) {
        return handlers.response.error({
          res,
          message: "All fields are required",
        });
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
        hireDate: new Date(hireDate),
        employeeId,
        username,
        password: hashedPassword,
        jobRole,
        shiftTiming,
        about,
        image,
      });

      if (!employee) {
        return handlers.response.error({
          res,
          message: "Failed to add employee",
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
        testType,
        fees,
        priorityLevel,
        appointmentDateTime,
        status,
        specialInstructions,
      } = req.body;

      if (
        !patientName ||
        !email ||
        !contactNumber ||
        !appointmentDateTime ||
        !employeeId ||
        !testType
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

      const appointment = await this.appointment.create({
        image,
        patientName,
        email,
        contactNumber,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        employeeId: employee._id, // reference
        testType,
        fees,
        priorityLevel,
        appointmentDateTime: new Date(appointmentDateTime),
        status,
        specialInstructions,
      });

      await Promise.all([
        sendEmail(
          req.user.email,
          "New Appointment Created",
          `New Appointment Just Added to the system`
        ),
        sendEmail(
          email,
          "New Appointment",
          `You appointment for ${testType} has been created at xyz labortaories`
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

      const { appointmentId } = req.body;

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
}

module.exports = new Service();
