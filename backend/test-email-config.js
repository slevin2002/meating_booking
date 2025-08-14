require("dotenv").config({ path: "./config.env" });
const nodemailer = require("nodemailer");

// Test email configuration
const testEmailConfig = async () => {
  console.log("Testing email configuration...");
  console.log("Email User:", process.env.EMAIL_USER);
  console.log(
    "Email Pass:",
    process.env.EMAIL_PASS ? "***configured***" : "NOT CONFIGURED"
  );

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Email configuration is incomplete!");
    console.error("Please set EMAIL_USER and EMAIL_PASS in config.env");
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    console.log("Verifying connection...");
    await transporter.verify();
    console.log("✅ Email configuration is valid!");

    // Send test email
    console.log("Sending test email...");
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing

    const mailOptions = {
      from: `"Meeting Booking System Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: "🧪 Email Configuration Test",
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you received this email, your Gmail App Password configuration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        <hr>
        <p><em>This is an automated test from your Meeting Booking System.</em></p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", result.messageId);
    console.log("Check your inbox for the test email.");
  } catch (error) {
    console.error("❌ Email configuration test failed:");
    console.error(error.message);

    if (error.code === "EAUTH") {
      console.error("\n🔧 Troubleshooting tips:");
      console.error(
        "1. Make sure 2-Factor Authentication is enabled on your Gmail account"
      );
      console.error(
        "2. Generate a new App Password from Google Account settings"
      );
      console.error('3. Ensure the App Password is for "Mail" app');
      console.error("4. Check that there are no extra spaces in the password");
      console.error("5. Verify the email address is correct");
    }
  }
};

// Run the test
testEmailConfig();
