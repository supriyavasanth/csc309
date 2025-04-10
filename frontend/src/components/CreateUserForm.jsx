import React, { useState } from "react";

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    utorid: "",
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setMessage("");
  };

  const handleCreate = async () => {
    setError("");
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          role: "REGULAR",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error creating user");

      setMessage("User created successfully!");
      setFormData({ utorid: "", name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
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
          placeholder="Full Name"
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
          placeholder="Email"
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
      {message && <p style={{ color: "green" }}>{message}</p>}

      <button className="btn btn-primary full-width" onClick={handleCreate}>
        Create User
      </button>
    </div>
  );
}
