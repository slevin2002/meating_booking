const axios = require("axios");
const jwt = require("jsonwebtoken");

class ZoomService {
  constructor() {
    this.baseURL = "https://api.zoom.us/v2";
  }

  get apiKey() {
    return process.env.ZOOM_API_KEY;
  }

  get apiSecret() {
    return process.env.ZOOM_API_SECRET;
  }

  // Generate JWT token for Zoom API authentication
  generateToken() {
    const payload = {
      iss: this.apiKey,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
    };
    return jwt.sign(payload, this.apiSecret, { algorithm: "HS256" });
  }

  // Get account users for Server-to-Server OAuth
  async getAccountUsers() {
    try {
      const token = this.generateToken();
      const response = await axios.get(`${this.baseURL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data.users;
    } catch (error) {
      console.error(
        "Error getting account users:",
        error.response?.data || error.message
      );
      throw new Error("Failed to get account users");
    }
  }

  // Get the first user ID from the account (usually the account owner)
  async getFirstUserId() {
    try {
      const users = await this.getAccountUsers();
      if (users && users.length > 0) {
        return users[0].id;
      }
      throw new Error("No users found in account");
    } catch (error) {
      console.error("Error getting first user ID:", error.message);
      throw new Error("Failed to get first user ID");
    }
  }

  // Create a Zoom meeting
  async createMeeting(meetingData) {
    try {
      const token = this.generateToken();
      const userId = await this.getFirstUserId();

      const response = await axios.post(
        `${this.baseURL}/users/${userId}/meetings`,
        {
          topic: meetingData.title,
          type: 2, // Scheduled meeting
          start_time: meetingData.startTime,
          duration: meetingData.duration,
          timezone: "UTC",
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: false,
            watermark: false,
            use_pmi: false,
            approval_type: 0,
            audio: "both",
            auto_recording: "none",
            waiting_room: false,
            meeting_authentication: false,
            registrants_email_notification: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        meeting: response.data,
        join_url: response.data.join_url,
        start_url: response.data.start_url,
        meeting_id: response.data.id,
        password: response.data.password,
      };
    } catch (error) {
      console.error("Zoom API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to create Zoom meeting: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Get meeting details
  async getMeeting(meetingId) {
    try {
      const token = this.generateToken();
      const response = await axios.get(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Zoom API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to get Zoom meeting: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Update meeting
  async updateMeeting(meetingId, meetingData) {
    try {
      const token = this.generateToken();
      const response = await axios.patch(
        `${this.baseURL}/meetings/${meetingId}`,
        {
          topic: meetingData.title,
          start_time: meetingData.startTime,
          duration: meetingData.duration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Zoom API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to update Zoom meeting: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Delete meeting
  async deleteMeeting(meetingId) {
    try {
      const token = this.generateToken();
      await axios.delete(`${this.baseURL}/meetings/${meetingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Zoom API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to delete Zoom meeting: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // List user's meetings
  async listMeetings(type = "scheduled") {
    try {
      const token = this.generateToken();
      const userId = await this.getFirstUserId();
      const response = await axios.get(
        `${this.baseURL}/users/${userId}/meetings`,
        {
          params: { type },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.meetings;
    } catch (error) {
      console.error("Zoom API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to list Zoom meetings: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // Add meeting registrants
  async addRegistrants(meetingId, registrants) {
    try {
      const token = this.generateToken();
      const response = await axios.post(
        `${this.baseURL}/meetings/${meetingId}/registrants`,
        {
          registrants: registrants.map((email) => ({ email })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Zoom API Error:", error.response?.data || error.message);
      throw new Error(
        `Failed to add registrants: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

module.exports = new ZoomService();
