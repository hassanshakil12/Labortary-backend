class Controller {
  constructor() {
    this.service = require("../services/common.service");
  }

  async getNotifications(req, res) {
    await this.service.getNotifications(req, res);
  }

  async readNotifications(req, res) {
    await this.service.readNotifications(req, res);
  }

  async deleteNotifications(req, res) {
    await this.service.deleteNotifications(req, res);
  }

  async toggleNotification(req, res) {
    await this.service.toggleNotification(req, res);
  }

  async toggleAccount(req, res) {
    await this.service.toggleAccount(req, res);
  }

  async updateProfile(req, res) {
    await this.service.updateProfile(req, res);
  }

  async changePassword(req, res) {
    await this.service.changePassword(req, res);
  }

  async forgetPassword(req, res) {
    await this.service.forgetPassword(req, res);
  }

  async verifyForgetPasswordOTP(req, res) {
    await this.service.verifyForgetPasswordOTP(req, res);
  }

  async resetPassword(req, res) {
    await this.service.resetPassword(req, res);
  }

  async generateFcmToken(req, res) {
    await this.service.generateFcmToken(req, res);
  }
}
module.exports = new Controller();
