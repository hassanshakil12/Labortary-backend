const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    patientName: {
      type: String,
    },
    email: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    labortary: {
      type: String,
    },
    fees: {
      type: Number,
    },
    priorityLevel: {
      type: String,
      enum: ["Urgent", "High", "Medium", "Low"],
      default: "Low",
    },
    appointmentDateTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Rejected"],
      default: "Pending",
    },
    specialInstructions: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
    },
    accountNumber: {
      type: String,
    },
    documents: [
      {
        type: String,
      },
    ],
    trackingId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
