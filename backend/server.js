const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
// Mount webhook route before express.json()
app.use("/api/webhooks", require("./routes/webhookRoutes"));

app.use(express.json());

// Load routes
app.use("/api/auth", authRoutes);
app.use("/api/generate", require("./routes/generateRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/billing", require("./routes/billingRoutes"));

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn("MONGO_URI is not defined, skipping MongoDB connection");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
