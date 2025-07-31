const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("⚠️ البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("⚠️ صيغة البريد الإلكتروني غير صحيحة")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("⚠️ صيغة البريد الإلكتروني غير صحيحة"),

  check("password")
    .notEmpty()
    .withMessage("⚠️ كلمة المرور مطلوبة")
    .isLength({ min: 6 })
    .withMessage("⚠️ يجب أن تكون كلمة المرور 6 أحرف على الأقل")
    .matches(/^[a-zA-Z0-9!@#$%^&*]+$/)
    .withMessage("⚠️ تحتوي كلمة المرور على رموز غير مسموح بها"),

  validatorMiddleware,
];
