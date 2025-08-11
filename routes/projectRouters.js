const express = require("express");
const router = express.Router();

const { AuthUser, allowedTO } = require("../controllers/authController");
const {
  getApartmentByName,
  toggleApartmentStatus,
  getProjectDataWithStats,
  getApartmentsByStatus,
} = require("../controllers/projectController");

const {
  apartmentStatusValidation,
} = require("../utils/validators/ChangeStatuseProject");

// Project Routes
router.get(
  "/data/:block?/:build?/:floor?/:apartment?",
  getProjectDataWithStats
);
router.post(
  "/stats/:block?/:build?/:floor?/:apartment?",
  getApartmentsByStatus
);
router.get("/name/:name", getApartmentByName);
router.post(
  "/:name",
  AuthUser,
  allowedTO("manager"),
  apartmentStatusValidation,
  toggleApartmentStatus
);

module.exports = router;
