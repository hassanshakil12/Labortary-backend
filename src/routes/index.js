const express = require("express");
const app = express();

const authRoutes = require("./auth.route");
const adminRoutes = require("./admin.route");
const employeeRoutes = require("./employee.route");
const commonRoutes = require("./common.route");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/common", commonRoutes);

module.exports = app;
