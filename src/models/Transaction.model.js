const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    accountNumber: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
    },
    dateAndTime: {
      type: Date,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Denied"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
