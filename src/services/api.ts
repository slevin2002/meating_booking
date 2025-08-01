import {
  API_CONFIG,
  buildApiUrl,
  buildApiUrlWithParams,
  API_HEADERS,
  handleApiError,
} from "../config/api";

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : buildApiUrl(endpoint);

  // Get token from localStorage for authenticated requests
  const token = localStorage.getItem("token");

  const headers = {
    ...API_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const defaultOptions: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        throw new Error("Authentication failed. Please login again.");
      }

      throw new Error(
        errorData.error ||
          errorData.message ||
          `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Meeting API functions
export const meetingAPI = {
  // Get all meetings
  getAll: async (params?: {
    teamId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.MEETINGS.GET_ALL,
      params || {}
    );
    return apiRequest(endpoint);
  },

  // Get meeting by ID
  getById: async (id: string) => {
    return apiRequest(API_CONFIG.MEETINGS.GET_BY_ID(id));
  },

  // Create new meeting
  create: async (meetingData: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: number;
    teamId: string;
    room: string;
    attendees: string[];
    status?: string;
  }) => {
    return apiRequest(API_CONFIG.MEETINGS.CREATE, {
      method: "POST",
      body: JSON.stringify({
        ...meetingData,
        status: meetingData.status || "scheduled",
      }),
    });
  },

  // Update meeting
  update: async (
    id: string,
    meetingData: Partial<{
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      duration: number;
      teamId: string;
      room: string;
      attendees: string[];
      status: string;
    }>
  ) => {
    return apiRequest(API_CONFIG.MEETINGS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(meetingData),
    });
  },

  // Delete meeting
  delete: async (id: string) => {
    return apiRequest(API_CONFIG.MEETINGS.DELETE(id), {
      method: "DELETE",
    });
  },

  // Cancel meeting
  cancel: async (id: string, cancelReason: string) => {
    return apiRequest(API_CONFIG.MEETINGS.CANCEL(id), {
      method: "PATCH",
      body: JSON.stringify({ cancelReason }),
    });
  },

  // Check room availability
  checkRoomAvailability: async (params: {
    room: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.MEETINGS.CHECK_ROOM_AVAILABILITY,
      params
    );
    return apiRequest(endpoint);
  },

  // Check member availability
  checkMemberAvailability: async (params: {
    member: string;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.MEETINGS.CHECK_MEMBER_AVAILABILITY,
      params
    );
    return apiRequest(endpoint);
  },

  // Get real-time status
  getRealTimeStatus: async () => {
    return apiRequest(API_CONFIG.MEETINGS.REAL_TIME_STATUS);
  },

  // Get employee current meetings
  getEmployeeCurrentMeetings: async (employeeName: string) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.MEETINGS.EMPLOYEE_CURRENT_MEETINGS,
      { employee: employeeName }
    );
    return apiRequest(endpoint);
  },

  // Get member meetings
  getMemberMeetings: async (member: string) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.MEETINGS.MEMBER_MEETINGS,
      { member }
    );
    return apiRequest(endpoint);
  },

  // Get stats overview
  getStatsOverview: async () => {
    return apiRequest(API_CONFIG.MEETINGS.STATS_OVERVIEW);
  },
};

// Team API functions
export const teamAPI = {
  // Get all teams
  getAll: async (params?: {
    search?: string;
    status?: string;
    lead?: string;
    page?: number;
    limit?: number;
  }) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.TEAMS.GET_ALL,
      params || {}
    );
    return apiRequest(endpoint);
  },

  // Get team by ID
  getById: async (id: string) => {
    return apiRequest(API_CONFIG.TEAMS.GET_BY_ID(id));
  },

  // Create new team
  create: async (teamData: {
    name: string;
    project: string;
    lead: string;
    members: string[];
    status: string;
    color: string;
    description?: string;
  }) => {
    return apiRequest(API_CONFIG.TEAMS.CREATE, {
      method: "POST",
      body: JSON.stringify(teamData),
    });
  },

  // Update team
  update: async (
    id: string,
    teamData: Partial<{
      name: string;
      project: string;
      lead: string;
      members: string[];
      status: string;
      color: string;
      description: string;
    }>
  ) => {
    return apiRequest(API_CONFIG.TEAMS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(teamData),
    });
  },

  // Delete team
  delete: async (id: string) => {
    return apiRequest(API_CONFIG.TEAMS.DELETE(id), {
      method: "DELETE",
    });
  },
};

// Authentication API functions
export const authAPI = {
  // Login user
  login: async (credentials: { email: string; password: string }) => {
    return apiRequest(API_CONFIG.USERS.LOGIN, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Register user
  register: async (userData: {
    email: string;
    password: string;
    role: string;
    teamId?: string;
  }) => {
    return apiRequest(API_CONFIG.USERS.REGISTER, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Logout user (client-side only)
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem("token");
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

// User API functions
export const userAPI = {
  // Get all users
  getAll: async (params?: {
    search?: string;
    role?: string;
    teamId?: string;
    page?: number;
    limit?: number;
  }) => {
    const endpoint = buildApiUrlWithParams(
      API_CONFIG.USERS.GET_ALL,
      params || {}
    );
    return apiRequest(endpoint);
  },

  // Get user by ID
  getById: async (id: string) => {
    return apiRequest(API_CONFIG.USERS.GET_BY_ID(id));
  },

  // Create new user
  create: async (userData: {
    name: string;
    email: string;
    role: string;
    teamId?: string;
  }) => {
    return apiRequest(API_CONFIG.USERS.CREATE, {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Update user
  update: async (
    id: string,
    userData: Partial<{
      name: string;
      email: string;
      role: string;
      teamId: string;
    }>
  ) => {
    return apiRequest(API_CONFIG.USERS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  delete: async (id: string) => {
    return apiRequest(API_CONFIG.USERS.DELETE(id), {
      method: "DELETE",
    });
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest(API_CONFIG.HEALTH);
};

export default {
  meetingAPI,
  teamAPI,
  userAPI,
  authAPI,
  healthCheck,
};
