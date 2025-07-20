const router = require("express").Router();
const controller = require("../controllers/laboratory.controller");
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
  "/get-archived",
  userAuthentication,
  controller.getArchivedAppointments.bind(controller)
);
router.get(
  "/get-archived/:appointmentId",
  userAuthentication,
  controller.getArchivedAppointmentById.bind(controller)
);
router.get(
  "/get-today-appointments",
  userAuthentication,
  controller.getTodayAppointments.bind(controller)
);
router.get(
  "/get-profile",
  userAuthentication,
  controller.getProfile.bind(controller)
);
router.get(
  "/get-dashboard",
  userAuthentication,
  controller.getDashboard.bind(controller)
);
router.post(
  "/add-appointment",
  userAuthentication,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  controller.createAppointment.bind(controller)
);
router.get(
  "/get-employees",
  userAuthentication,
  controller.getEmployees.bind(controller)
);

module.exports = router;
