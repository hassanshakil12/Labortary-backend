class Controller {
  constructor() {
    this.service = require("../services/common.service");
  }

  async getNoifications(req, res) {
    await this.service.getNoifications(req, res);
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
}
module.exports = new Controller();
