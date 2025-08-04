const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const statusValues = ["available", "sold", "not_offered", "reserved"];

exports.apartmentStatusValidation = [
  check("status")
    .notEmpty()
    .withMessage("⚠️ الحالة مطلوبة")
    .isIn(statusValues)
    .withMessage(`⚠️ الحالة يجب أن تكون واحدة من: ${statusValues.join(", ")}`),

  validatorMiddleware,
];
