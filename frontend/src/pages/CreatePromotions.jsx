import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";

export default function CreatePromotion() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    name: "",
    type: "FLAT",
    points: "",
    rate: "",
    minSpending: "",
    startTime: "",
    endTime: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post("http://localhost:8000/promotions", form, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setMessage("Promotion created successfully!");
      setForm({
        name: "",
        type: "FLAT",
        points: "",
        rate: "",
        minSpending: "",
        startTime: "",
        endTime: ""
      });
    } catch (err) {
      console.error("Failed to create promotion:", err);
      setMessage("Failed to create promotion.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Create Promotion</h2>

        <form className="promotion-form" onSubmit={handleSubmit}>
          <label>Promotion Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />

          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="FLAT">FLAT</option>
            <option value="BONUS">BONUS</option>
            <option value="BOOST">BOOST</option>
          </select>

          <label>Points</label>
          <input
            type="number"
            name="points"
            value={form.points}
            onChange={handleChange}
            placeholder="Flat points (if FLAT)"
          />

          <label>Rate (0-1)</label>
          <input
            type="number"
            name="rate"
            value={form.rate}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="1"
            placeholder="Rate (e.g., 0.25 for 25%)"
          />

          <label>Minimum Spending</label>
          <input
            type="number"
            name="minSpending"
            value={form.minSpending}
            onChange={handleChange}
            required
          />

          <label>Start Time</label>
          <input
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
          />

          <label>End Time</label>
          <input
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
          />

          <button className="btn btn-primary full-width" type="submit">
            Create Promotion
          </button>
        </form>

        {message && <p className="info-message">{message}</p>}
      </div>
    </div>
  );
}
