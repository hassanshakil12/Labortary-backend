const mongoose = require("mongoose");

const capitalizeName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const transactionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
    },
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
    },
    amount: {
      type: Number,
      default: 0,
    },
    accountNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (this.amount > 0) {
            return typeof v === "string" && /^\d{17,34}$/.test(v);
          }
          return true;
        },
        message:
          "Account number is required and must be a 17 to 34-digit string when fees > 0",
      },
      set: (v) => (v ? v.trim() : v),
    },
    patientName: {
      type: String,
      set: capitalizeName,
      trim: true,
      required: [true, "Patient name is required"],
    },
    dateAndTime: {
      type: Date,
      required: [true, "Appointment date and time is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Denied"],
      default: "Pending",
      required: [true, "Transaction status is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
