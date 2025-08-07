import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authAPI } from "../../services/api";
import ErrorNotification from "./ErrorNotification";
import "./Auth.css";

const Login: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password"
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithOTP } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleRequestOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email first");
      return;
    }

    setOtpLoading(true);
    setError(null);

    try {
      console.log("Requesting OTP for:", formData.email);
      await authAPI.requestOTP(formData.email);
      console.log("OTP sent successfully");
      setOtpSent(true);
      setError(null);
    } catch (err: any) {
      console.error("OTP request failed:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (loginMethod === "password") {
        await login(formData.email, formData.password);
      } else {
        // OTP login
        console.log("Attempting OTP login with:", {
          email: formData.email,
          otp: formData.otp,
        });
        await loginWithOTP(formData.email, formData.otp);
        console.log("OTP login successful");
      }

      // Navigate to calendar page after successful login
      navigate("/calendar", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <div className="login-method-toggle">
          <button
            type="button"
            className={`toggle-btn ${
              loginMethod === "password" ? "active" : ""
            }`}
            onClick={() => setLoginMethod("password")}
            disabled={loading}
          >
            🔐 Password
          </button>
          <button
            type="button"
            className={`toggle-btn ${loginMethod === "otp" ? "active" : ""}`}
            onClick={() => setLoginMethod("otp")}
            disabled={loading}
          >
            📱 OTP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          {loginMethod === "password" ? (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="otp">OTP Code</label>
              <div className="otp-input-group">
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="otp-request-btn"
                  onClick={handleRequestOTP}
                  disabled={otpLoading || !formData.email}
                >
                  {otpLoading
                    ? "Sending..."
                    : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
                </button>
              </div>
              {otpSent && (
                <div className="otp-sent-message">
                  ✅ OTP sent to your email. Check your inbox.
                </div>
              )}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
        </div>
      </div>

      <ErrorNotification
        error={error}
        onClose={() => setError(null)}
        type="error"
        title="Login Error"
        duration={8000}
      />
    </div>
  );
};

export default Login;
