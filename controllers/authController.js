const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError("⚠️ البريد الإلكتروني وكلمة المرور مطلوبان", 400));
  }

  const foundUser = await User.findOne({ email });

  const isPasswordValid =
    foundUser && (await bcrypt.compare(password, foundUser.password));

  if (!isPasswordValid) {
    return next(
      new ApiError("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة", 401)
    );
  }

  const token = generateToken(foundUser._id);

  res.status(200).json({ user: foundUser, token });
});

exports.getMe = asyncHandler(async (req, res) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("You are not logged in. Please login first.", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    throw new ApiError("Invalid token. Please login again.", 401);
  }

  const user = await User.findById(decoded.userId).select("-Password");

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.Password_Changed_At) {
    const passwordChangedAt = parseInt(
      new Date(user.Password_Changed_At).getTime() / 1000,
      10
    );
    if (passwordChangedAt > decoded.iat) {
      throw new ApiError("Password changed recently. Please login again.", 401);
    }
  }

  res.status(200).json({ message: "successful ✅", user });
});

exports.AuthUser = asyncHandler(async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return next(
      new ApiError("⚠️ لم تقم بتسجيل الدخول. الرجاء تسجيل الدخول أولاً", 401)
    );
  }

  const token = authHeader.replace("Bearer ", "");
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (error) {
    return next(
      new ApiError(
        "⚠️ التوكن غير صالح أو منتهي. الرجاء تسجيل الدخول مرة أخرى",
        401
      )
    );
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    return next(new ApiError("⚠️ المستخدم غير موجود", 404));
  }

  if (user.passwordChangedAt) {
    const passwordChangedTime = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passwordChangedTime > decoded.iat) {
      return next(
        new ApiError(
          "⚠️ انتهت صلاحية التوكن. الرجاء تسجيل الدخول مرة أخرى",
          401
        )
      );
    }
  }

  req.user = user;
  next();
});

exports.allowedTO = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new ApiError(`🚷 صلاحيات مرفوضة!  غير مسموح له بالوصول`, 403)
      );
    }
    next();
  });
