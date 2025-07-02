const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign({ _id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  generateToken,
  generateOTP,
};
