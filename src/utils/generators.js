const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign({ _id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = {
  generateToken,
};
