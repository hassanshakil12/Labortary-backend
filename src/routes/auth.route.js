const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const userAuthentication = require("../middlewares/userAuthentication");

router.post("/sign-in", controller.signIn.bind(controller));
router.post(
  "/sign-out",
  userAuthentication,
  controller.signOut.bind(controller)
);

module.exports = router;
