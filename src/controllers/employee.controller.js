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
}
module.exports = new Controller();
