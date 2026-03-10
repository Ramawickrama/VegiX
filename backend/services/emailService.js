const nodemailer = require('nodemailer');

// Create transport (configure with your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send order published notification email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.userName - User's name
 * @param {string} options.orderNumber - Order number
 * @param {string} options.vegetableName - Vegetable name
 * @param {number} options.quantity - Order quantity
 * @param {string} options.orderType - Type of order (farmer-sell, broker-buy, etc.)
 */
exports.sendOrderPublishedEmail = async (options) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Order Published Successfully! ✓</h2>
        
        <p>Dear <strong>${options.userName}</strong>,</p>
        
        <p>Your order has been successfully published on VegiX Platform.</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Order Details:</h3>
          <p><strong>Order Number:</strong> ${options.orderNumber}</p>
          <p><strong>Vegetable:</strong> ${options.vegetableName}</p>
          <p><strong>Quantity:</strong> ${options.quantity} ${options.unit || 'kg'}</p>
          <p><strong>Order Type:</strong> ${options.orderType}</p>
        </div>
        
        <p>You can track your order and manage it from your VegiX dashboard.</p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated email from VegiX. Please do not reply to this email.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: `Order Published - ${options.vegetableName} (${options.orderNumber})`,
      html: htmlContent,
    });

    console.log(`✓ Order published email sent to ${options.email}`);
  } catch (error) {
    console.error('Error sending order published email:', error.message);
    // Don't throw - email failure shouldn't block order creation
  }
};

/**
 * Send broker commission notification
 * @param {Object} options - Email options
 * @param {string} options.email - Broker email
 * @param {string} options.brokerName - Broker's name
 * @param {string} options.orderNumber - Order number
 * @param {string} options.vegetableName - Vegetable name
 * @param {number} options.quantity - Quantity
 * @param {number} options.commission - Commission amount
 */
exports.sendBrokerCommissionEmail = async (options) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Selling Order Published! ✓</h2>
        
        <p>Dear <strong>${options.brokerName}</strong>,</p>
        
        <p>Your selling order has been successfully published on VegiX Platform.</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Selling Order Details:</h3>
          <p><strong>Order Number:</strong> ${options.orderNumber}</p>
          <p><strong>Vegetable:</strong> ${options.vegetableName}</p>
          <p><strong>Quantity:</strong> ${options.quantity} ${options.unit || 'kg'}</p>
          <p><strong>Final Price Per Unit:</strong> Rs. ${options.finalPricePerUnit}</p>
          <p><strong>Total Final Price:</strong> Rs. ${options.totalFinalPrice}</p>
          <p style="background-color: #f39c12; padding: 10px; border-radius: 3px; color: white;">
            <strong>Your Commission (10%):</strong> Rs. ${options.commission}
          </p>
        </div>
        
        <p>Buyers can now see your selling order on the platform!</p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated email from VegiX. Please do not reply to this email.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: `Selling Order Published - ${options.vegetableName} (${options.orderNumber})`,
      html: htmlContent,
    });

    console.log(`✓ Broker commission email sent to ${options.email}`);
  } catch (error) {
    console.error('Error sending broker commission email:', error.message);
  }
};

/**
 * Send buyer order notification
 * @param {Object} options - Email options
 * @param {string} options.email - Buyer email
 * @param {string} options.buyerName - Buyer's name
 * @param {string} options.orderNumber - Order number
 * @param {string} options.vegetableName - Vegetable name
 * @param {number} options.quantity - Quantity requested
 * @param {number} options.budget - Budget per unit
 */
exports.sendBuyerOrderEmail = async (options) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Buyer Order Posted! ✓</h2>
        
        <p>Dear <strong>${options.buyerName}</strong>,</p>
        
        <p>Your buyer order has been successfully posted on VegiX Platform.</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">Buyer Order Details:</h3>
          <p><strong>Order Number:</strong> ${options.orderNumber}</p>
          <p><strong>Vegetable:</strong> ${options.vegetableName}</p>
          <p><strong>Quantity Needed:</strong> ${options.quantity} ${options.unit || 'kg'}</p>
          <p><strong>Budget Per Unit:</strong> Rs. ${options.budget}</p>
          <p><strong>Total Budget:</strong> Rs. ${options.totalBudget}</p>
        </div>
        
        <p>Brokers can now see your buyer order and make offers!</p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px;">
          This is an automated email from VegiX. Please do not reply to this email.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: `Buyer Order Posted - ${options.vegetableName} (${options.orderNumber})`,
      html: htmlContent,
    });

    console.log(`✓ Buyer order email sent to ${options.email}`);
  } catch (error) {
    console.error('Error sending buyer order email:', error.message);
  }
};

/**
 * Send generic notification email
 */
exports.sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`✓ Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};
