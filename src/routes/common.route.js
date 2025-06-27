const router = require("express").Router();
const controller = require("../controllers/common.controller");
const userAuthentication = require("../middlewares/userAuthentication");

router.get(
  "/get-notifications",
  userAuthentication,
  controller.getNoifications.bind(controller)
);
router.post(
  "/delete-notifications",
  userAuthentication,
  controller.deleteNotifications.bind(controller)
);
router.post(
  "/toggle-notification",
  userAuthentication,
  controller.toggleNotification.bind(controller)
);
router.post(
  "/toggle-account",
  userAuthentication,
  controller.toggleAccount.bind(controller)
);

module.exports = router;
