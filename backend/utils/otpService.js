const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map();

// Create transporter for OTP emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP with expiration (5 minutes)
const storeOTP = (email, otp) => {
  const expiration = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email, { otp, expiration });
};

// Verify OTP
const verifyOTP = (email, otp) => {
  const stored = otpStore.get(email);
  if (!stored) {
    return { valid: false, message: "OTP not found" };
  }

  if (Date.now() > stored.expiration) {
    otpStore.delete(email);
    return { valid: false, message: "OTP expired" };
  }

  if (stored.otp !== otp) {
    return { valid: false, message: "Invalid OTP" };
  }

  // Remove OTP after successful verification
  otpStore.delete(email);
  return { valid: true, message: "OTP verified successfully" };
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose = "registration") => {
  try {
    const transporter = createTransporter();

    const isGeneralMeeting = purpose === "general-meeting";
    const subject = isGeneralMeeting
      ? "🔐 OTP for General Meeting Booking Verification"
      : "🔐 Your OTP for Registration";
    const title = isGeneralMeeting
      ? "General Meeting Booking Verification"
      : "OTP Verification";
    const subtitle = isGeneralMeeting
      ? "Verify the General Meeting booking request"
      : "Complete your registration with the code below";
    const description = isGeneralMeeting
      ? "Enter this 6-digit code to verify the General Meeting booking request"
      : "Enter this 6-digit code to complete your registration";

    const mailOptions = {
      from: `"Meeting Booking System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>OTP Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 10px;
              text-align: center;
              margin-bottom: 20px;
            }
            .otp-container {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 10px;
              text-align: center;
              margin-bottom: 20px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 20px 0;
              padding: 15px;
              background: white;
              border-radius: 8px;
              border: 2px dashed #667eea;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              color: #6c757d;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              color: #856404;
              padding: 10px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #ffc107;
            }
            ${
              isGeneralMeeting
                ? `
            .general-meeting-info {
              background: #e3f2fd;
              color: #1976d2;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              border-left: 4px solid #2196f3;
            }
            `
                : ""
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 ${title}</h1>
            <p>${subtitle}</p>
          </div>
          
          <div class="otp-container">
            <h2>Your Verification Code</h2>
            <div class="otp-code">${otp}</div>
            <p>${description}</p>
            
            ${
              isGeneralMeeting
                ? `
            <div class="general-meeting-info">
              <strong>📋 General Meeting Details:</strong>
              <ul style="text-align: left; margin: 10px 0;">
                <li>This OTP is required to book a General Meeting</li>
                <li>Only the team lead can verify General Meeting bookings</li>
                <li>General Meetings are company-wide events</li>
              </ul>
            </div>
            `
                : ""
            }
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="text-align: left; margin: 10px 0;">
                <li>This code will expire in 5 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this code, please ignore this email</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the Meeting Booking System.</p>
            <p>If you have any questions, please contact support.</p>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Clean up expired OTPs
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiration) {
      otpStore.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
};
