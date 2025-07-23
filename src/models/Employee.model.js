const mongoose = require("mongoose");
const { validate } = require("./Admin.model");

const capitalizeName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      default: null,
      set: capitalizeName,
      trim: true,
      required: [true, "Full name is required"],
    },
    email: {
      type: String,
      default: null,
      unique: true,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    contactNumber: {
      type: String,
      default: null,
      trim: true,
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid contact number"],
    },
    address: {
      type: String,
      default: null,
      trim: true,
      required: [true, "Address is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      trim: true,
      enum: ["Male", "Female", "Other"],
    },
    hireDate: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: (v) => {
          return v instanceof Date && !isNaN(v.getTime()) && v <= new Date();
        },
        message:
          "Date of birth must be a valid date and cannot be in the future",
      },
    },
    employeeId: {
      type: String,
      required: [true, "Employee Id is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    username: {
      type: String,
      default: null,
      unique: true,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 6 characters long"],
      trim: true,
    },
    jobRole: {
      type: String,
      required: [true, "Job role is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["employee"],
      default: "employee",
      required: [true, "Role is required"],
    },
    shiftTiming: {
      type: String,
      required: [true, "Shift timing is required"],
      trim: true,
    },
    about: {
      type: String,
      default: null,
      trim: true,
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    userAuthToken: {
      type: String,
      default: null,
      trim: true,
    },
    userFCMToken: {
      type: String,
      default: null,
      trim: true,
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
      required: [true, "Department is required"],
      trim: true,
    },
    forgetPasswordOTP: {
      type: Number,
      default: null,
      min: [100000, "OTP must be a 6-digit number"],
      max: [999999, "OTP must be a 6-digit number"],
      validate: {
        validator: function (v) {
          return (
            v === null || (Number.isInteger(v) && v >= 100000 && v <= 999999)
          );
        },
        message: "OTP must be a 6-digit integer or null",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
