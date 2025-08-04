const express = require("express");
const router = express.Router();

const { AuthUser, allowedTO } = require("../controllers/authController");
const {
  getAllProjects,
  getApartmentByName,
  toggleApartmentStatus,
  getProjectData,
  getApartmentsStats,
} = require("../controllers/projectController");

const {
  apartmentStatusValidation,
} = require("../utils/validators/ChangeStatuseProject");

// Project Routes
router.get("/", getAllProjects);
router.get("/stats", getApartmentsStats);
router.get("/data/:block/:build?/:floor?/:apartment?", getProjectData);
router.get("/name/:name", getApartmentByName);
router.post(
  "/:name",
  AuthUser,
  allowedTO("manager"),
  apartmentStatusValidation,
  toggleApartmentStatus
);

module.exports = router;
