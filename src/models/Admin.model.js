const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
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
      type: Number,
      required: true,
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
      enum: ["admin"],
      default: "admin",
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
    address: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: String,
      required: true,
      enum: ["Admin"],
      default: "Admin",
    },
    forgetPasswordOTP: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
