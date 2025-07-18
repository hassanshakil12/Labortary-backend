const { handlers } = require("../utils/handlers");
const jwt = require("jsonwebtoken");
const employee = require("../models/Employee.model");
const admin = require("../models/Admin.model");
const laboratory = require("../models/Laboratory.model");

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
    const model =
      decoded.role === "employee"
        ? employee
        : decoded.role === "admin"
        ? admin
        : decoded.role === "laboratory"
        ? laboratory
        : handlers.logger.failed({ message: "Invalid role in token..." });

    let user = await model.findOne({
      _id: decoded._id,
      role: decoded.role,
    });
    if (!user) {
      return handlers.response.unavailable({
        res,
        message: "User not found...",
      });
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
