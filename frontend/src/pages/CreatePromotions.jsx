import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./Dashboard.css";

export default function CreatePromotion() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "automatic",
    startTime: "",
    endTime: "",
    minSpending: "",
    rate: "",
    points: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      startTime: form.startTime,
      endTime: form.endTime,
    };

    if (form.minSpending) payload.minSpending = Number(form.minSpending);
    if (form.rate) payload.rate = Number(form.rate);
    if (form.points) payload.points = parseInt(form.points);

    try {
      await axios.post("http://localhost:8000/promotions", payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      setMessage("Promotion created successfully!");
      setForm({
        name: "",
        description: "",
        type: "automatic",
        startTime: "",
        endTime: "",
        minSpending: "",
        rate: "",
        points: ""
      });
    } catch (err) {
      console.error("Failed to create promotion:", err);
      setMessage("Failed to create promotion.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Create Promotion</h1>
          <h4 className="role-subheading">Fill in the form to add a new promotion</h4>
        </div>

        <div className="dashboard-body">
          <div className="info-card">
            <form className="promotion-form" onSubmit={handleSubmit}>
              <label>Promotion Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <label>Description *</label>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                required
              />

              <label>Type *</label>
              <select name="type" value={form.type} onChange={handleChange} required>
                <option value="automatic">Automatic</option>
                <option value="one-time">One-Time</option>
              </select>

              <label>Start Time *</label>
              <input
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
              />

              <label>End Time *</label>
              <input
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
              />

              <label>Minimum Spending (optional)</label>
              <input
                type="number"
                name="minSpending"
                value={form.minSpending}
                onChange={handleChange}
                min="0"
              />

              <label>Rate (optional, 0-1)</label>
              <input
                type="number"
                name="rate"
                value={form.rate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="1"
              />

              <label>Bonus Points (optional)</label>
              <input
                type="number"
                name="points"
                value={form.points}
                onChange={handleChange}
                min="0"
              />

              <button className="small-primary-btn" type="submit">
                Create Promotion
              </button>

              {message && <p className="muted">{message}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
