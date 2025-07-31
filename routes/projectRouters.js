const express = require("express");
const router = express.Router();

const { AuthUser, allowedTO } = require("../controllers/authController");
const {
  getAllProjects,
  getApartmentByName,
  toggleApartmentStatus,
} = require("../controllers/projectController");

// const {
//   updateUserValidator,
//   //   addUserValidator,
// } = require("../utils/validators/userValidator");

// router.use(AuthUser, allowedTO("manager"));

// Project Routes
router.get("/", getAllProjects);
router.get("/:name", getApartmentByName);
router.post("/:name", AuthUser, allowedTO("manager"), toggleApartmentStatus);

module.exports = router;
