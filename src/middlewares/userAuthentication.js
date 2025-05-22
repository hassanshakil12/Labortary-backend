const { handlers } = require("../utils/handlers");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee.model");
const Admin = require("../models/Admin.model");

const userAuthentication = async (req, res, next) => {
  try {
    const userAuthToken = req.headers["authorization"];
    if (!userAuthToken) {
      return handlers.response.unauthorized({
        res,
        message: "Authorization token is required...",
      });
    }

    const token = userAuthToken.startsWith("Bearer ")
      ? userAuthToken.split(" ")[1]
      : userAuthToken;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = await Employee.findOne({ _id: decoded._id });
    if (!user) {
      user = await Admin.findOne({ _id: decoded._id });
      if (!user) {
        return handlers.response.unavailable({
          res,
          message: "User not found...",
        });
      }
    }

    req.user = user;

    next();
  } catch (error) {
    handlers.logger.failed({
      objectType: "UserAuthentication",
      message: error.message,
    });
    return handlers.response.error({
      res,
      message: error.message,
    });
  }
};

module.exports = userAuthentication;
