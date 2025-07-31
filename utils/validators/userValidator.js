const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const ApiError = require("../../utils/ApiError");
const User = require("../../models/User");

exports.addUserValidator = [
  check("name")
    .notEmpty()
    .withMessage("⚠️ الاسم مطلوب")
    .isLength({ min: 3 })
    .withMessage("⚠️ يجب أن يحتوي الاسم على 3 أحرف على الأقل")
    .trim(),

  check("email")
    .notEmpty()
    .withMessage("⚠️ البريد الإلكتروني مطلوب")
    .isEmail()
    .withMessage("⚠️ صيغة البريد الإلكتروني غير صحيحة")
    .trim()
    .normalizeEmail(),

  check("password")
    .notEmpty()
    .withMessage("⚠️ كلمة المرور مطلوبة")
    .isLength({ min: 6 })
    .withMessage("⚠️ يجب أن تكون كلمة المرور 6 أحرف على الأقل"),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required ⚠️")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new ApiError("Passwords do not match ⚠️");
      }
      return true;
    }),

  validatorMiddleware,
];

// التحقق عند تحديث بيانات المستخدم
exports.updateUserValidator = [
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("⚠️ يجب أن يحتوي الاسم على 3 أحرف على الأقل")
    .trim(),

  check("email")
    .optional()
    .isEmail()
    .withMessage("⚠️ صيغة البريد الإلكتروني غير صحيحة")
    .trim()
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const existingUser = await User.findOne({ email: value });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        throw new ApiError("⚠️ هذا البريد الإلكتروني مستخدم بالفعل", 400);
      }
    }),

  check("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("⚠️ يجب أن تكون كلمة المرور 6 أحرف على الأقل"),

  validatorMiddleware,
];
