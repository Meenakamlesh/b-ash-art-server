const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct,
} = require("../controllers/productController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", protect, adminOnly, upload.any(), createProduct);
router.put("/:id", protect, adminOnly, upload.any(), updateProduct);
router.put("/:id/stock", protect, adminOnly, updateStock);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;