const express = require("express");
const cors = require("cors");
require("dotenv").config();
const limiters = require("./middlewares/rateLimiter"); // 👈 Import limiters

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Apply general rate limiter to all routes
app.use(limiters.general);

// Apply specific limiters
app.use("/api/auth", limiters.auth);
app.use("/api/products", limiters.product);

// For orders, you might want to be more specific
// Apply to all order routes
app.use("/api/orders", limiters.createOrder);

// Or apply only to POST (create) endpoint in your orderRoutes.js
// See the "Advanced" section below

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Backend is running"
  });
});

app.get("/", (req, res) => {
    res.send("API is running...");
});

module.exports = app;