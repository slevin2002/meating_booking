// API Configuration
export const API_CONFIG = {
  // Base URL - Change this to switch between development and production
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:4444",
  // BASE_URL: process.env.REACT_APP_API_URL || "https://meetings.testatozas.in",

  // Meeting endpoints
  MEETINGS: {
    GET_ALL: "/api/meetings",
    GET_BY_ID: (id: string) => `/api/meetings/${id}`,
    CREATE: "/api/meetings",
    UPDATE: (id: string) => `/api/meetings/${id}`,
    DELETE: (id: string) => `/api/meetings/${id}`,
    CANCEL: (id: string) => `/api/meetings/${id}/cancel`,
    CHECK_ROOM_AVAILABILITY: "/api/meetings/check-room-availability",
    CHECK_MEMBER_AVAILABILITY: "/api/meetings/check-member-availability",
    REAL_TIME_STATUS: "/api/meetings/real-time-status",
    EMPLOYEE_CURRENT_MEETINGS: "/api/meetings/employee-current-meetings",
    MEMBER_MEETINGS: "/api/meetings/member-meetings",
    STATS_OVERVIEW: "/api/meetings/stats/overview",
  },

  // Team endpoints
  TEAMS: {
    GET_ALL: "/api/teams",
    GET_BY_ID: (id: string) => `/api/teams/${id}`,
    CREATE: "/api/teams",
    UPDATE: (id: string) => `/api/teams/${id}`,
    DELETE: (id: string) => `/api/teams/${id}`,
  },

  // User endpoints
  USERS: {
    GET_ALL: "/api/users",
    GET_BY_ID: (id: string) => `/api/users/${id}`,
    CREATE: "/api/users",
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    LOGIN: "/api/users/login",
    LOGIN_OTP: "/api/users/login-otp",
    REGISTER: "/api/users/register",
    REQUEST_OTP: "/api/users/request-otp",
    VERIFY_OTP: "/api/users/verify-otp",
  },

  // Status endpoints
  STATUS: {
    GET_ALL: "/api/status",
    GET_BY_ID: (id: string) => `/api/status/${id}`,
  },

  // Health check endpoint
  HEALTH: "/api/health",
};

// Production API configuration
export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://meetings.testatozas.in/api" // Nginx handles port 4444 proxying
    : "http://localhost:4444/api";

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to build URL with query parameters
export const buildApiUrlWithParams = (
  endpoint: string,
  params: Record<string, any>
): string => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value.toString());
    }
  });

  return url.toString();
};

// Common API headers
export const API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// API error handler
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return (
      error.response.data?.message ||
      `HTTP ${error.response.status}: ${error.response.statusText}`
    );
  } else if (error.request) {
    // Request was made but no response received
    return "No response from server. Please check your connection.";
  } else {
    // Something else happened
    return error.message || "An unexpected error occurred.";
  }
};
