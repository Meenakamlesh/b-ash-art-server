const express = require("express");
const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Test protected route
router.get("/me", protect, (req, res) => {
  res.status(200).json({ message: "You are authenticated", user: req.user });
});


module.exports = router;