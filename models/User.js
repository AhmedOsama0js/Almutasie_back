const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "⚠️ الاسم مطلوب"],
      trim: true,
      minlength: [3, "⚠️ يجب أن يكون الاسم 3 أحرف على الأقل"],
    },
    email: {
      type: String,
      required: [true, "⚠️ البريد الإلكتروني مطلوب"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "⚠️ كلمة المرور مطلوبة"],
      minlength: [6, "⚠️ يجب أن تكون كلمة المرور 6 أحرف على الأقل"],
    },
    role: {
      type: String,
      enum: ["user", "manager"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
