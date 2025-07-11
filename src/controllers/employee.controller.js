class Controller {
  constructor() {
    this.service = require("../services/employee.service");
  }

  async getAppointments(req, res) {
    await this.service.getAppointments(req, res);
  }

  async getAppointmentById(req, res) {
    await this.service.getAppointmentById(req, res);
  }

  async gerArchivedAppointments(req, res) {
    await this.service.gerArchivedAppointments(req, res);
  }

  async getTodayAppointments(req, res) {
    await this.service.getTodayAppointments(req, res);
  }

  async getDashboard(req, res) {
    await this.service.getDashboard(req, res);
  }

  async getProfile(req, res) {
    await this.service.getProfile(req, res);
  }

  async uploadTrackingId(req, res) {
    await this.service.uploadTrackingId(req, res);
  }
}
module.exports = new Controller();
