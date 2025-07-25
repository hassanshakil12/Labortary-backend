const mongoose = require("mongoose");
const { validate } = require("./Laboratory.model");

const capitalizeName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const appointmentSchema = new mongoose.Schema(
  {
    createdBy: {
      type: String,
      required: [true, "Created by is required"],
      trim: true,
      enum: ["admin", "laboratory"],
      default: "admin",
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    patientName: {
      type: String,
      set: capitalizeName,
      trim: true,
      required: [true, "Patient name is required"],
    },
    email: {
      type: String,
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
      trim: true,
      required: [true, "Contact number is required"],
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid contact number"],
    },
    address: {
      type: String,
      trim: true,
      required: [true, "Address is required"],
    },
    dateOfBirth: {
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
    gender: {
      type: String,
      required: [true, "Gender is required"],
      trim: true,
      enum: ["Male", "Female", "Others"],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    labortary: {
      type: String,
      required: [true, "Laboratory is required"],
      trim: true,
      set: capitalizeName,
    },
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
    },
    fees: {
      type: Number,
      default: 0,
      min: [0, "Fees cannot be negative"],
    },
    priorityLevel: {
      type: String,
      enum: ["Urgent", "High", "Medium", "Low"],
      default: "Low",
      required: [true, "Priority level is required"],
      trim: true,
    },
    appointmentDateTime: {
      type: Date,
      required: [true, "Appointment date and time is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Rejected"],
      default: "Pending",
      required: [true, "Status is required"],
      trim: true,
    },
    specialInstructions: {
      type: String,
      default: null,
      trim: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
      default: 0,
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v >= 0;
        },
        message: "Age must be a non-negative integer",
      },
    },
    accountNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (this.fees > 0) {
            return typeof v === "string" && /^\d{17,34}$/.test(v);
          }
          return true;
        },
        message:
          "Account number is required and must be a 17 to 34-digit string when fees > 0",
      },
      set: (v) => (v ? v.trim() : v),
    },
    documents: [
      {
        type: String,
        default: null,
        trim: true,
      },
    ],
    trackingId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
