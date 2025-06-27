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
    testType: {
      type: String,
    },
    fees: {
      type: Number,
    },
    priorityLevel: {
      type: String,
    },
    appointmentDateTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "Pending",
    },
    specialInstructions: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    documnts: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
