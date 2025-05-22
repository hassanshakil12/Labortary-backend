const { handlers } = require("../utils/handlers");

class Service {
  constructor() {
    this.employee = require("../models/Employee.model");
    this.appointment = require("../models/Appointment.model");
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

      const { appointmentId } = req.body;

      const appointment = await this.appointment.find({
        _id: appointmentId,
        employeeId: req.user._id,
      });

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
}

module.exports = new Service();
