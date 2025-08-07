import React from "react";
import { useAuth } from "../../contexts/AuthContext";

const DebugAuth: React.FC = () => {
  const { user, token, isAuthenticated, loading } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <h4>Auth Debug</h4>
      <div>Loading: {loading ? "Yes" : "No"}</div>
      <div>Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
      <div>Token: {token ? "Present" : "None"}</div>
      <div>User: {user ? user.email : "None"}</div>
      <div>
        LocalStorage Token: {localStorage.getItem("token") ? "Present" : "None"}
      </div>
      <div>
        LocalStorage User: {localStorage.getItem("user") ? "Present" : "None"}
      </div>
    </div>
  );
};

export default DebugAuth;
