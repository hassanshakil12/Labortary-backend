const router = require("express").Router();
const controller = require("../controllers/employee.controller");
const userAuthentication = require("../middlewares/userAuthentication");
const upload = require("../middlewares/multer");

router.get(
  "/get-appointments",
  userAuthentication,
  controller.getAppointments.bind(controller)
);
router.get(
  "/get-appointment/:appointmentId",
  userAuthentication,
  controller.getAppointmentById.bind(controller)
);
router.get(
  "/get-archeived",
  userAuthentication,
  controller.gerArchivedAppointments.bind(controller)
);
router.get(
  "/get-today-appointments",
  userAuthentication,
  controller.getTodayAppointments.bind(controller)
);
router.get(
  "/get-dashboard",
  userAuthentication,
  controller.getDashboard.bind(controller)
);
router.get(
  "/get-profile",
  userAuthentication,
  controller.getProfile.bind(controller)
);
router.post(
  "/upload-tracking/:appointmentId",
  userAuthentication,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.uploadTrackingId.bind(controller)
);

module.exports = router;
