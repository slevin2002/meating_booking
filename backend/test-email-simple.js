require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmailFunctionality() {
  try {
    console.log("Testing email functionality...");

    // Test nodemailer transporter creation
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log("✅ Transporter created successfully");

    // Test email sending
    const mailOptions = {
      from: `"Meeting Booking System" <${process.env.EMAIL_USER}>`,
      to: "slevinvarghees@gmail.com",
      subject: "📧 Test Email from Meeting Booking System",
      text: "This is a test email to verify the email functionality is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">📧 Test Email</h2>
          <p>This is a test email to verify the email functionality is working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>System:</strong> Meeting Booking System</p>
        </div>
      `,
    };

    console.log("Sending test email...");
    const result = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.messageId);
    console.log("✅ Email functionality is working correctly!");
  } catch (error) {
    console.error("❌ Email test failed:", error.message);

    if (error.code === "EAUTH") {
      console.error(
        "Authentication failed. Please check your EMAIL_USER and EMAIL_PASS in config.env"
      );
    } else if (error.code === "ECONNECTION") {
      console.error(
        "Connection failed. Please check your internet connection and Gmail settings"
      );
    } else {
      console.error("Unknown error occurred:", error);
    }
  }
}

testEmailFunctionality();
