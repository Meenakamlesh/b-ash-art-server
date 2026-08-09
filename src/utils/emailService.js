// server/src/utils/emailService.js

const sendEmail = require("./sendEmail");

// Admin Order Email
const sendAdminOrderEmail = async (order, product, user) => {
  try {
    // Use same email as customer or separate admin email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    console.log(`📧 Sending admin email to: ${adminEmail}`);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: #8B4513; color: white; padding: 15px; text-align: center; border-radius: 5px;">
          <h2 style="margin: 0;">🛍️ New Order Received!</h2>
        </div>
        
        <div style="padding: 20px 0;">
          <h3>Order #${order.id}</h3>
          <p><strong>Customer:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>Color:</strong> ${order.color || 'N/A'}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p style="font-size: 18px; font-weight: bold; color: #8B4513;">Total: ₹${product.price * order.quantity}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        <div style="background: #f5f0eb; padding: 10px; border-radius: 5px; margin-top: 10px;">
          <p style="margin: 0;"><strong>📋 Admin Actions:</strong></p>
          <p style="margin: 5px 0;">Process this order and update status when shipped.</p>
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
          © ${new Date().getFullYear()} B Ash Art
        </p>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `🛍️ New Order #${order.id} from ${user.name}`,
      html,
    });
    
    console.log(`✅ Admin email sent to ${adminEmail}`);
  } catch (error) {
    console.error('❌ Admin email error:', error.message);
  }
};

// Customer Order Confirmation Email
const sendCustomerOrderEmail = async (order, product, user) => {
  try {
    console.log(`📧 Sending customer email to: ${user.email}`);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 5px;">
          <h2 style="margin: 0;">✅ Order Confirmed!</h2>
        </div>
        
        <div style="padding: 20px 0;">
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your order has been placed successfully. Here are the details:</p>
          
          <h3>Order #${order.id}</h3>
          <p><strong>Product:</strong> ${product.name}</p>
          <p><strong>Color:</strong> ${order.color || 'N/A'}</p>
          <p><strong>Quantity:</strong> ${order.quantity}</p>
          <p style="font-size: 18px; font-weight: bold; color: #8B4513;">Total: ₹${product.price * order.quantity}</p>
          
          <div style="background: #f5f0eb; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0;"><strong>📦 What's Next?</strong></p>
            <p style="margin: 5px 0;">We'll process your order and send you a shipping confirmation soon.</p>
            <p style="margin: 5px 0;">Estimated delivery: 3-5 business days</p>
          </div>
        </div>
        
        <p style="color: #888; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
          Thanks for shopping with B Ash Art! 🙏<br>
          © ${new Date().getFullYear()} B Ash Art
        </p>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #8B4513;">Order Status Update</h2>
        <p>Dear <strong>${user.name}</strong>,</p>
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