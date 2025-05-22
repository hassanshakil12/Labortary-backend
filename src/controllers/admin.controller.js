class Controller {
  constructor() {
    this.service = require("../services/admin.service");
  }

  async addEmployee(req, res) {
    await this.service.addEmployee(req, res);
  }

  async getEmployees(req, res) {
    await this.service.getEmployees(req, res);
  }

  async getProfile(req, res) {
    await this.service.getProfile(req, res);
  }

  async createAppointment(req, res) {
    await this.service.createAppointment(req, res);
  }

  async getAppointments(req, res) {
    await this.service.getAppointments(req, res);
  }

  async getAppointmentById(req, res) {
    await this.service.getAppointmentById(req, res);
  }
}

module.exports = new Controller();
