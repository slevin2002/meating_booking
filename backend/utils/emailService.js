const nodemailer = require("nodemailer");
const User = require("../models/User");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Format date and time for email
const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

// Generate email HTML content
const generateMeetingEmailHTML = (meeting, creator, attendees) => {
  const startTime = formatDateTime(meeting.startTime);
  const endTime = formatDateTime(meeting.endTime);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Meeting Invitation</title>
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
        .meeting-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-label {
          font-weight: bold;
          color: #495057;
        }
        .detail-value {
          color: #212529;
        }
        .attendees {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 14px;
        }
                 .btn {
           display: inline-block;
           padding: 10px 20px;
           background: #667eea;
           color: white !important;
           text-decoration: none;
           border-radius: 5px;
           margin: 10px 5px;
           font-weight: bold;
         }
         .btn span {
           color: white !important;
         }
         .btn-text {
           color: white !important;
           font-weight: bold;
         }
        .btn:hover {
          background: #5a6fd8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📅 Meeting Invitation</h1>
        <p>You have been invited to a meeting</p>
      </div>
      
      <div class="meeting-details">
        <h2>${meeting.title}</h2>
        <p><strong>Description:</strong> ${
          meeting.description || "No description provided"
        }</p>
        
        <div class="detail-row">
          <span class="detail-label">📅 Date & Time:</span>
          <span class="detail-value">${startTime}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">⏰ Duration:</span>
          <span class="detail-value">${meeting.duration} minutes</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">🏢 Room:</span>
          <span class="detail-value">${meeting.room}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">👥 Team:</span>
          <span class="detail-value">${meeting.teamName}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">📧 Organized by:</span>
          <span class="detail-value">${creator.name} (${creator.email})</span>
        </div>
        
        <div class="attendees">
          <h3>👥 Attendees (${attendees.length}):</h3>
          <ul>
            ${attendees
              .map(
                (attendee) => `<li>${attendee.name} (${attendee.email})</li>`
              )
              .join("")}
          </ul>
        </div>
      </div>
      
             <div style="text-align: center; margin: 20px 0;">
         <a href="${
           process.env.FRONTEND_URL || "http://localhost:3000"
         }/meeting/${
    meeting._id
  }" class="btn" style="color: white !important; text-decoration: none;">
           <span class="btn-text" style="color: white !important; font-weight: bold;">📋 View Meeting Details</span>
         </a>
       </div>
      
      <div class="footer">
        <p>This is an automated notification from the Meeting Booking System.</p>
        <p>If you have any questions, please contact the meeting organizer.</p>
      </div>
    </body>
    </html>
  `;
};

// Generate plain text email content
const generateMeetingEmailText = (meeting, creator, attendees) => {
  const startTime = formatDateTime(meeting.startTime);

  return `
Meeting Invitation

Title: ${meeting.title}
Description: ${meeting.description || "No description provided"}
Date & Time: ${startTime}
Duration: ${meeting.duration} minutes
Room: ${meeting.room}
Team: ${meeting.teamName}
Organized by: ${creator.name} (${creator.email})

Attendees:
${attendees
  .map((attendee) => `- ${attendee.name} (${attendee.email})`)
  .join("\n")}

View meeting details: ${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/meeting/${meeting._id}

This is an automated notification from the Meeting Booking System.
If you have any questions, please contact the meeting organizer.
  `;
};

// Send meeting invitation emails to attendees
const sendMeetingInvitations = async (meeting, creator) => {
  try {
    const transporter = createTransporter();

    // Get attendee details from User collection
    const attendeeNames = meeting.attendees;
    const attendeeUsers = await User.find({
      name: { $in: attendeeNames },
    }).select("name email");

    // Create a map of name to user for easy lookup
    const nameToUserMap = {};
    attendeeUsers.forEach((user) => {
      nameToUserMap[user.name] = user;
    });

    // Send emails to each attendee
    const emailPromises = attendeeNames.map(async (attendeeName) => {
      const attendee = nameToUserMap[attendeeName];

      if (!attendee) {
        console.log(`No user found for name: ${attendeeName}`);
        return { name: attendeeName, success: false, error: "User not found" };
      }

      const mailOptions = {
        from: `"Meeting Booking System" <${process.env.EMAIL_USER}>`,
        to: attendee.email,
        subject: `📅 Meeting Invitation: ${meeting.title}`,
        text: generateMeetingEmailText(meeting, creator, attendeeUsers),
        html: generateMeetingEmailHTML(meeting, creator, attendeeUsers),
      };

      try {
        const result = await transporter.sendMail(mailOptions);
        console.log(
          `Email sent successfully to ${attendee.name} (${attendee.email}):`,
          result.messageId
        );
        return {
          name: attendeeName,
          email: attendee.email,
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error(
          `Failed to send email to ${attendee.name} (${attendee.email}):`,
          error
        );
        return {
          name: attendeeName,
          email: attendee.email,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.allSettled(emailPromises);

    // Log results
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value?.success
    ).length;
    const failed = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value?.success)
    ).length;

    console.log(
      `Email notification results: ${successful} successful, ${failed} failed`
    );

    return {
      total: attendeeNames.length,
      successful,
      failed,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { success: false, error: r.reason }
      ),
    };
  } catch (error) {
    console.error("Error sending meeting invitations:", error);
    throw error;
  }
};

// Send meeting cancellation email
const sendMeetingCancellationEmail = async (
  meeting,
  cancelledBy,
  attendees
) => {
  try {
    const transporter = createTransporter();

    const attendeeUsers = await User.find({
      name: { $in: attendees },
    }).select("name email");

    const cancellationHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Meeting Cancelled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
          .meeting-details { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .detail-label { font-weight: bold; color: #495057; }
          .detail-value { color: #212529; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>❌ Meeting Cancelled</h1>
          <p>The following meeting has been cancelled</p>
        </div>
        
        <div class="meeting-details">
          <h2>${meeting.title}</h2>
          <p><strong>Description:</strong> ${
            meeting.description || "No description provided"
          }</p>
          
          <div class="detail-row">
            <span class="detail-label">📅 Date & Time:</span>
            <span class="detail-value">${formatDateTime(
              meeting.startTime
            )}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">🏢 Room:</span>
            <span class="detail-value">${meeting.room}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">👥 Team:</span>
            <span class="detail-value">${meeting.teamName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">❌ Cancelled by:</span>
            <span class="detail-value">${cancelledBy.name} (${
      cancelledBy.email
    })</span>
          </div>
          
          ${
            meeting.cancelReason
              ? `
          <div class="detail-row">
            <span class="detail-label">📝 Reason:</span>
            <span class="detail-value">${meeting.cancelReason}</span>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the Meeting Booking System.</p>
        </div>
      </body>
      </html>
    `;

    const emailPromises = attendees.map(async (attendeeName) => {
      const attendee = attendeeUsers.find((user) => user.name === attendeeName);

      if (!attendee) {
        console.log(`No user found for name: ${attendeeName}`);
        return { name: attendeeName, success: false, error: "User not found" };
      }

      const mailOptions = {
        from: `"Meeting Booking System" <${process.env.EMAIL_USER}>`,
        to: attendee.email,
        subject: `❌ Meeting Cancelled: ${meeting.title}`,
        html: cancellationHTML,
      };

      try {
        const result = await transporter.sendMail(mailOptions);
        console.log(
          `Cancellation email sent successfully to ${attendee.name} (${attendee.email}):`,
          result.messageId
        );
        return {
          name: attendeeName,
          email: attendee.email,
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error(
          `Failed to send cancellation email to ${attendee.name} (${attendee.email}):`,
          error
        );
        return {
          name: attendeeName,
          email: attendee.email,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value?.success
    ).length;
    const failed = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value?.success)
    ).length;

    console.log(
      `Cancellation email results: ${successful} successful, ${failed} failed`
    );

    return {
      total: attendees.length,
      successful,
      failed,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { success: false, error: r.reason }
      ),
    };
  } catch (error) {
    console.error("Error sending cancellation emails:", error);
    throw error;
  }
};

module.exports = {
  sendMeetingInvitations,
  sendMeetingCancellationEmail,
  formatDateTime,
};
