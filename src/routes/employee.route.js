const router = require("express").Router();
const controller = require("../controllers/employee.controller");
const userAuthentication = require("../middlewares/userAuthentication");

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
