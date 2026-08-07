const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../utils/cloudinaryClient");
const prisma = new PrismaClient();

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "product-images" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

const sanitizeColorKey = (color) => color.trim().toLowerCase().replace(/\s+/g, "_");

// @desc    Create a new product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, price, colors } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    let colorsArray = [];
    if (colors) {
      try {
        colorsArray = JSON.parse(colors);
      } catch {
        colorsArray = colors.split(",").map((c) => c.trim()).filter(Boolean);
      }
    }

    const fileMap = {};
    (req.files || []).forEach((f) => {
      const match = f.fieldname.match(/^variant_(.+)$/);
      if (match) fileMap[match[1]] = f;
    });

    let variants = [];
    let imageUrls = [];
    let totalStock = 0;

    if (colorsArray.length > 0) {
      for (const color of colorsArray) {
        const key = sanitizeColorKey(color);
        let imageUrl = null;
        if (fileMap[key]) {
          const result = await uploadToCloudinary(fileMap[key].buffer);
          imageUrl = result.secure_url;
        }
        const stockForColor = Number(req.body[`stock_${key}`]) || 0;
        totalStock += stockForColor;
        variants.push({ color, imageUrl, stock: stockForColor });
      }
      imageUrls = variants.map((v) => v.imageUrl).filter(Boolean);
    } else {
      // No colors — simple single stock
      totalStock = Number(req.body.stock) || 0;
      if (fileMap["default"]) {
        const result = await uploadToCloudinary(fileMap["default"].buffer);
        imageUrls = [result.secure_url];
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        price: Number(price),
        stock: totalStock,
        colors: colorsArray,
        images: imageUrls,
        variants,
        imageUrl: imageUrls[0] || null,
      },
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Create Product Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get all products
const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: "desc" } });
    res.status(200).json({ count: products.length, products });
  } catch (error) {
    console.error("Get Products Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get single product
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product });
  } catch (error) {
    console.error("Get Product Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update product (full edit — name, price, colors, images)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, colors } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    let colorsArray = existingProduct.colors;
    if (colors) {
      try {
        colorsArray = JSON.parse(colors);
      } catch {
        colorsArray = colors.split(",").map((c) => c.trim()).filter(Boolean);
      }
    }

    const existingVariants = Array.isArray(existingProduct.variants) ? existingProduct.variants : [];

    const fileMap = {};
    (req.files || []).forEach((f) => {
      const match = f.fieldname.match(/^variant_(.+)$/);
      if (match) fileMap[match[1]] = f;
    });

    let variants = [];
    let imageUrls = [];
    let totalStock = 0;

    if (colorsArray.length > 0) {
      for (const color of colorsArray) {
        const key = sanitizeColorKey(color);
        const existingMatch = existingVariants.find((v) => sanitizeColorKey(v.color) === key);

        let imageUrl = existingMatch ? existingMatch.imageUrl : null;
        if (fileMap[key]) {
          const result = await uploadToCloudinary(fileMap[key].buffer);
          imageUrl = result.secure_url;
        }

        const stockKey = `stock_${key}`;
        const stockForColor =
          req.body[stockKey] !== undefined
            ? Number(req.body[stockKey])
            : (existingMatch ? existingMatch.stock : 0);

        totalStock += stockForColor;
        variants.push({ color, imageUrl, stock: stockForColor });
      }
      imageUrls = variants.map((v) => v.imageUrl).filter(Boolean);
    } else {
      totalStock = req.body.stock !== undefined ? Number(req.body.stock) : existingProduct.stock;
      if (fileMap["default"]) {
        const result = await uploadToCloudinary(fileMap["default"].buffer);
        imageUrls = [result.secure_url];
      } else {
        imageUrls = existingProduct.images;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name ?? existingProduct.name,
        price: price !== undefined ? Number(price) : existingProduct.price,
        stock: totalStock,
        colors: colorsArray,
        images: imageUrls,
        variants,
        imageUrl: imageUrls[0] || existingProduct.imageUrl,
      },
    });

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    console.error("Update Product Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Quick stock update (Inventory page se, bina images ke)
// @route   PUT /api/products/:id/stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { variants, stock } = req.body; // variants = [{color, stock}] OR simple stock

    const existingProduct = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });

    let newVariants = existingProduct.variants;
    let totalStock = existingProduct.stock;

    if (Array.isArray(existingProduct.variants) && existingProduct.variants.length > 0 && variants) {
      newVariants = existingProduct.variants.map((v) => {
        const update = variants.find((u) => u.color === v.color);
        return update ? { ...v, stock: Number(update.stock) } : v;
      });
      totalStock = newVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else if (stock !== undefined) {
      totalStock = Number(stock);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: { stock: totalStock, variants: newVariants },
    });

    res.status(200).json({ message: "Stock updated successfully", product: updatedProduct });
  } catch (error) {
    console.error("Update Stock Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!existingProduct) return res.status(404).json({ message: "Product not found" });
    await prisma.product.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateStock,
  deleteProduct,
};