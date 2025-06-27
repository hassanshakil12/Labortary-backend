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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
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
router.post(
  "/update-appointment",
  userAuthentication,
  controller.updateAppointmentStatus.bind(controller)
);
router.get(
  "/get-archeived",
  userAuthentication,
  controller.getArchivedAppointments.bind(controller)
);
router.get(
  "/get-scheduled",
  userAuthentication,
  controller.getScheduledAppointments.bind(controller)
);
router.get(
  "/get-today-appointments",
  userAuthentication,
  controller.getTodayAppointments.bind(controller)
);
router.get(
  "/get-employees",
  userAuthentication,
  controller.getEmployees.bind(controller)
);
router.get(
  "/get-employee/:employeeId",
  userAuthentication,
  controller.getEmployeeById.bind(controller)
);
router.get(
  "/get-active-employees",
  userAuthentication,
  controller.getActiveEmployees.bind(controller)
);
router.post(
  "/delete-employee/:employeeId",
  userAuthentication,
  controller.deleteEmployee.bind(controller)
);
router.get(
  "/get-dashboard",
  userAuthentication,
  controller.getDashboard.bind(controller)
);

module.exports = router;
