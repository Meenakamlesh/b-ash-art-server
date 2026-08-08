// server/src/services/emailService.js

const sendEmail = require("../utils/sendEmail");

// Admin Order Email
const sendAdminOrderEmail = async (order, product, user) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@yourstore.com";
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #8B4513;">🛍️ New Order #${order.id}</h2>
        <p><strong>Customer:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Color:</strong> ${order.color || 'N/A'}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Total:</strong> ₹${product.price * order.quantity}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `🛍️ New Order #${order.id} from ${user.name}`,
      html,
    });
    
    console.log(`✅ Admin email sent for order #${order.id}`);
  } catch (error) {
    console.error('❌ Admin email error:', error.message);
  }
};

// Customer Order Confirmation Email
const sendCustomerOrderEmail = async (order, product, user) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #8B4513;">✅ Order Confirmed!</h2>
        <p>Dear ${user.name},</p>
        <p>Your order has been placed successfully.</p>
        <p><strong>Order #${order.id}</strong></p>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Color:</strong> ${order.color || 'N/A'}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Total:</strong> ₹${product.price * order.quantity}</p>
        <p>We'll notify you when your order ships.</p>
        <p>Thanks for shopping with B Ash Art! 🙏</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `✅ Order Confirmed #${order.id} - B Ash Art`,
      html,
    });
    
    console.log(`✅ Customer email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Customer email error:', error.message);
  }
};

// Order Status Update Email
const sendOrderStatusUpdateEmail = async (order, user, product) => {
  try {
    const statusMessages = {
      pending: "⏳ Your order is pending confirmation",
      confirm: "✅ Your order has been confirmed!",
      cancelled: "❌ Your order has been cancelled"
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #8B4513;">Order Status Update</h2>
        <p>Dear ${user.name},</p>
        <p>${statusMessages[order.status] || `Your order status: ${order.status}`}</p>
        <p><strong>Order #${order.id}</strong></p>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Color:</strong> ${order.color || 'N/A'}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p>Thanks for shopping with B Ash Art! 🙏</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: `📦 Order #${order.id} Status Update - B Ash Art`,
      html,
    });
    
    console.log(`✅ Status update email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Status update email error:', error.message);
  }
};

module.exports = {
  sendAdminOrderEmail,
  sendCustomerOrderEmail,
  sendOrderStatusUpdateEmail,
};