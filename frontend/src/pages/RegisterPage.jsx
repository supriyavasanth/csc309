import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import "./Dashboard.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    utorid: "",
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleRegister = async () => {
    setError("");

    const { utorid, name, email, password } = formData;

    if (!utorid || !email || !name || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          utorid,
          name,
          email,
          password,
          role: "REGULAR",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Register New User</h1>
          <h4 className="role-subheading">For Cashiers and Managers</h4>
        </div>

        <div className="info-card">
          <div className="form-group">
            <label className="form-label">UTORid</label>
            <input
              className="form-control"
              name="utorid"
              placeholder="e.g., johndoe"
              value={formData.utorid}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              placeholder="johndoe@mail.utoronto.ca"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="btn btn-primary full-width" onClick={handleRegister}>
            Create Account
          </button>

          <p className="signup-text" style={{ marginTop: "1rem" }}>
            Already registered?
            <a href="/login" className="bluelink"> Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
