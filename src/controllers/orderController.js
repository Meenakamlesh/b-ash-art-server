// server/src/controllers/orderController.js

const prisma = require("../utils/prisma");
const { sendAdminOrderEmail, sendCustomerOrderEmail, sendOrderStatusUpdateEmail } = require("../utils/emailService");



// @desc    Create a new order
// @route   POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { productId, quantity, color } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Product ID and quantity are required" });
    }
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero" });
    }

    // Get product and user data
    const [product, user] = await Promise.all([
      prisma.product.findUnique({ where: { id: Number(productId) } }),
      prisma.user.findUnique({ 
        where: { id: userId },
        select: { name: true, email: true }
      })
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updatedVariants = product.variants;

    if (product.colors && product.colors.length > 0) {
      if (!color) {
        return res.status(400).json({ message: "Please select a color" });
      }
      const variant = (product.variants || []).find((v) => v.color === color);
      if (!variant) {
        return res.status(400).json({ message: "Invalid color selected" });
      }
      if (variant.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock available for ${color}` });
      }
      updatedVariants = product.variants.map((v) =>
        v.color === color ? { ...v, stock: v.stock - quantity } : v
      );
    } else {
      if (product.stock < quantity) {
        return res.status(400).json({ message: "Insufficient stock available" });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        productId: Number(productId),
        quantity,
        color: color || null,
        status: "pending",
      },
    });

    const newTotalStock =
      product.colors && product.colors.length > 0
        ? updatedVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : product.stock - quantity;

    await prisma.product.update({
      where: { id: Number(productId) },
      data: { stock: newTotalStock, variants: updatedVariants },
    });

    // ✅ SEND BOTH EMAILS - Admin AND Customer
    try {
      // 1. Admin ko email
      await sendAdminOrderEmail(order, product, user);
      
      // 2. Customer ko email
      await sendCustomerOrderEmail(order, product, user);
      
      console.log(`✅ Both emails sent for order #${order.id}`);
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
    }

    res.status(201).json({ 
      message: "Order placed successfully", 
      order,
      emailsSent: true 
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ... rest of your controller functions remain same ...
// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });

    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    console.error("Get My Orders Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get all orders (admin only)
// @route   GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { id: "desc" },
    });

    // Get user and product details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [user, product] = await Promise.all([
          prisma.user.findUnique({
            where: { id: order.userId },
            select: { name: true, email: true }
          }),
          prisma.product.findUnique({
            where: { id: order.productId },
            select: { name: true, price: true }
          })
        ]);
        return { ...order, user, product };
      })
    );

    res.status(200).json({ count: ordersWithDetails.length, orders: ordersWithDetails });
  } catch (error) {
    console.error("Get All Orders Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "confirm", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Get user and product data separately
    const [user, product] = await Promise.all([
      prisma.user.findUnique({
        where: { id: existingOrder.userId },
        select: { name: true, email: true }
      }),
      prisma.product.findUnique({
        where: { id: existingOrder.productId },
        select: { name: true, price: true }
      })
    ]);

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    // ✅ Send status update email (if user and product exist)
    if (user && product) {
      try {
        await sendOrderStatusUpdateEmail(existingOrder, user, product);
      } catch (emailError) {
        console.error('Email error:', emailError.message);
      }
    }

    res.status(200).json({ 
      message: "Order status updated", 
      order: updatedOrder 
    });
  } catch (error) {
    console.error("Update Order Status Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};