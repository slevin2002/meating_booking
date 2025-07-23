const API_BASE_URL = "http://localhost:5000/api";

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
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
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/meetings${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return apiRequest(endpoint);
  },

  // Get meeting by ID
  getById: async (id: string) => {
    return apiRequest(`/meetings/${id}`);
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
    return apiRequest("/meetings", {
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
    return apiRequest(`/meetings/${id}`, {
      method: "PUT",
      body: JSON.stringify(meetingData),
    });
  },

  // Delete meeting
  delete: async (id: string) => {
    return apiRequest(`/meetings/${id}`, {
      method: "DELETE",
    });
  },
};

// Team API functions
export const teamAPI = {
  // Get all teams
  getAll: async () => {
    return apiRequest("/teams");
  },

  // Get team by ID
  getById: async (id: string) => {
    return apiRequest(`/teams/${id}`);
  },

  // Create new team
  create: async (teamData: {
    name: string;
    project: string;
    lead: string;
    members: string[];
    status: string;
    color?: string;
  }) => {
    return apiRequest("/teams", {
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
    }>
  ) => {
    return apiRequest(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(teamData),
    });
  },

  // Delete team
  delete: async (id: string) => {
    return apiRequest(`/teams/${id}`, {
      method: "DELETE",
    });
  },
};

// User API functions
export const userAPI = {
  // Get all users
  getAll: async () => {
    return apiRequest("/users");
  },

  // Get user by ID
  getById: async (id: string) => {
    return apiRequest(`/users/${id}`);
  },

  // Create new user
  create: async (userData: {
    name: string;
    email: string;
    role: string;
    teamId?: string;
  }) => {
    return apiRequest("/users", {
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
    return apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest("/health");
};

export default {
  meetingAPI,
  teamAPI,
  userAPI,
  healthCheck,
};
