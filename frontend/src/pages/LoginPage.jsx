import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Login.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    try {
      await login(utorid, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="title">Loyalty Program Portal</div>
        <div className="subtitle">Welcome back!</div>

        <div className="form-group">
          <label htmlFor="utoridInput" className="form-label">Username</label>
          <input
            type="text"
            className={`form-control ${error ? "error-label" : ""}`}
            id="utoridInput"
            placeholder="Username"
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="passwordInput" className="form-label">Password</label>
          <input
            type="password"
            className={`form-control ${error ? "error-label" : ""}`}
            id="passwordInput"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button className="btn btn-primary full-width" onClick={handleSubmit}>
          Login
        </button>

        <p className="signup-text muted">
            Don’t have an account? Please ask a cashier or manager to create one for you.
        </p>
      </div>
    </div>
  );
}
