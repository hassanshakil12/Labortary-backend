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

const schema = new mongoose.Schema(
  {
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
      default: null,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 6 characters long"],
      trim: true,
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    fullName: {
      type: String,
      default: null,
      set: capitalizeName,
      trim: true,
      required: [true, "Full name is required"],
    },
    role: {
      type: String,
      enum: ["laboratory"],
      default: "laboratory",
    },
    address: {
      type: String,
      default: null,
      trim: true,
      required: [true, "Address is required"],
      //   unique: true,
    },
    contactNumber: {
      type: String,
      default: null,
      trim: true,
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid contact number"],
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
    timings: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: [true, "Day is required"],
        },
        time: [
          {
            type: Date,
            default: null,
            validate: {
              validator: function (v) {
                return v === null || (v instanceof Date && !isNaN(v.getTime()));
              },
              message: "Invalid date format for timing.",
            },
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: false,
    },
    isNotification: {
      type: Boolean,
      default: true,
    },
    about: {
      type: String,
      default: null,
      trim: true,
    },
    userAuthToken: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Laboratory", schema);
