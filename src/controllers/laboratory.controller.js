class Controller {
  constructor() {
    this.service = require("../services/laboratory.service");
  }

  async getAppointments(req, res) {
    await this.service.getAppointments(req, res);
  }

  async getAppointmentById(req, res) {
    await this.service.getAppointmentById(req, res);
  }

  async getArchivedAppointments(req, res) {
    await this.service.getArchivedAppointments(req, res);
  }

  async getArchivedAppointmentById(req, res) {
    await this.service.getArchivedAppointmentById(req, res);
  }

  async getTodayAppointments(req, res) {
    await this.service.getTodayAppointments(req, res);
  }

  async getProfile(req, res) {
    await this.service.getProfile(req, res);
  }

  async getDashboard(req, res) {
    await this.service.getDashboard(req, res);
  }

  async createAppointment(req, res) {
    await this.service.createAppointment(req, res);
  }

  async getEmployees(req, res) {
    await this.service.getEmployees(req, res);
  }
}

module.exports = new Controller();
