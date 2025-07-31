const { param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const mongoose = require("mongoose");

exports.mongoIdValidator = [
  param("id").custom((val) => {
    if (!mongoose.Types.ObjectId.isValid(val)) {
      throw new Error("⚠️ المعرف (ID) غير صالح");
    }
    return true;
  }),
  validatorMiddleware,
];
