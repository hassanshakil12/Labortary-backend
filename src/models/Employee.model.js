const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    hireDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["employee"],
      default: "employee",
    },
    shiftTiming: {
      type: String,
      required: true,
    },
    about: {
      type: String,
    },
    image: {
      type: String,
    },
    userAuthToken: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isNotification: {
      type: Boolean,
      default: true,
    },
    department: {
      type: String,
      enum: ["Laboratory", "Radiology", "Pharmacy", "Admin"],
    },
    forgetPasswordOTP: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
