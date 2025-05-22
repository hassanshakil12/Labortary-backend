const router = require("express").Router();
const controller = require("../controllers/admin.controller");
const userAuthentication = require("../middlewares/userAuthentication");
const upload = require("../middlewares/multer");

router.post(
  "/add-employee",
  userAuthentication,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.addEmployee.bind(controller)
);
router.get(
  "/get-employees",
  userAuthentication,
  controller.getEmployees.bind(controller)
);
router.get(
  "/get-profile",
  userAuthentication,
  controller.getProfile.bind(controller)
);
router.post(
  "/create-appointment",
  userAuthentication,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.createAppointment.bind(controller)
);
router.get(
  "/get-appointments",
  userAuthentication,
  controller.getAppointments.bind(controller)
);
router.get(
  "/get-appointment",
  userAuthentication,
  controller.getAppointmentById.bind(controller)
);

module.exports = router;
