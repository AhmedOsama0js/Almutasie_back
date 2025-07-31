const express = require("express");
const router = express.Router();

const { getMe, login, AuthUser } = require("../controllers/authController");
const { loginValidator } = require("../utils/validators/authValidator");

router.post("/login", loginValidator, login);
router.get("/getMe", AuthUser, getMe);

module.exports = router;
