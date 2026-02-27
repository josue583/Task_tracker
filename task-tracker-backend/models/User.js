const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minLength: 6 },
    name: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

function isBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$\d{2}\$/.test(str);
}

userSchema.methods.comparePassword = async function (candidate) {
  if (!candidate || !this.password) return false;
  const stored = this.password;
  if (isBcryptHash(stored)) {
    return bcrypt.compare(candidate, stored);
  }
  if (stored === candidate) {
    this.password = candidate;
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model("User", userSchema);
