class Controller {
  constructor() {
    this.service = require("../services/auth.service");
  }

  async signIn(req, res) {
    await this.service.signIn(req, res);
  }

  async signOut(req, res) {
    await this.service.signOut(req, res);
  }
}

module.exports = new Controller();
