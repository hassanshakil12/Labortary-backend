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

  async updateAppointmentStatus(req, res) {
    await this.service.updateAppointmentStatus(req, res);
  }

  async getArchivedAppointments(req, res) {
    await this.service.getArchivedAppointments(req, res);
  }

  async getScheduledAppointments(req, res) {
    await this.service.getScheduledAppointments(req, res);
  }

  async getTodayAppointments(req, res) {
    await this.service.getTodayAppointments(req, res);
  }

  async getEmployees(req, res) {
    await this.service.getEmployees(req, res);
  }

  async getEmployeeById(req, res) {
    await this.service.getEmployeeById(req, res);
  }

  async getActiveEmployees(req, res) {
    await this.service.getActiveEmployees(req, res);
  }

  async deleteEmployee(req, res) {
    await this.service.deleteEmployee(req, res);
  }

  async getDashboard(req, res) {
    await this.service.getDashboard(req, res);
  }

  async getTransactions(req, res) {
    await this.service.getTransactions(req, res);
  }

  async updateTransactionStatus(req, res) {
    await this.service.updateTransactionStatus(req, res);
  }

  async getRecentTransaction(req, res) {
    await this.service.getRecentTransaction(req, res);
  }

  async getTotalEarningsOfCurrentMonth(req, res) {
    await this.service.getTotalEarningsOfCurrentMonth(req, res);
  }
}

module.exports = new Controller();
