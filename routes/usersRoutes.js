const express = require("express");
const router = express.Router();

const { AuthUser, allowedTO } = require("../controllers/authController");
const { addRecord, updateRecord } = require("../controllers/userController");

const {
  updateUserValidator,
  addUserValidator,
} = require("../utils/validators/userValidator");

router.use(AuthUser, allowedTO("manager"));

// User Routes
router.post("/", addUserValidator, addRecord);
router.put("/:id", updateUserValidator, updateRecord);

module.exports = router;
