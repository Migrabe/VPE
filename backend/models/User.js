const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    picture: { type: String },
    isPro: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
