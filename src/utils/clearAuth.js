// Utility function to clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  console.log("Authentication data cleared");
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
};

// Function to get current user data
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Function to get current token
export const getCurrentToken = () => {
  return localStorage.getItem("token");
};
