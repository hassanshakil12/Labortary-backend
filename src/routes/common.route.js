const router = require("express").Router();
const controller = require("../controllers/common.controller");
const userAuthentication = require("../middlewares/userAuthentication");
const upload = require("../middlewares/multer")

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
router.post(
  "/update-profile",
  userAuthentication,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.updateProfile.bind(controller)
);
router.post(
  "/change-password",
  userAuthentication,
  controller.changePassword.bind(controller)
);

module.exports = router;
