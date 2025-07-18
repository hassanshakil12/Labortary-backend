const express = require("express");
const app = express();

const authRoutes = require("./auth.route");
const adminRoutes = require("./admin.route");
const commonRoutes = require("./common.route");
const employeeRoutes = require("./employee.route");
const laboratoryRoutes = require("./laboratory.route");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/common", commonRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/laboratory", laboratoryRoutes);

module.exports = app;
