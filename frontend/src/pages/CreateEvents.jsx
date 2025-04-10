import React, { useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";

export default function EventCreate() {
  const { token } = useAuth();

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    capacity: "",
    points: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        capacity: form.capacity === "" ? null : parseInt(form.capacity),
        points: parseInt(form.points),
      };

      await axios.post("http://localhost:8000/events", payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setMessage("Event created successfully.");
      setForm({
        name: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        capacity: "",
        points: "",
      });
    } catch (err) {
      console.error("Failed to create event:", err);
      setMessage("All fields, excluding capacity, are mandatory.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Create New Event</h2>

        <div className="event-form">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} />

          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} />

          <label>Location</label>
          <input name="location" value={form.location} onChange={handleChange} />

          <label>Start Time</label>
          <input
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
          />

          <label>End Time</label>
          <input
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
          />

          <label>Capacity (optional)</label>
          <input
            name="capacity"
            type="number"
            min="1"
            value={form.capacity}
            onChange={handleChange}
          />

          <label>Total Points</label>
          <input
            name="points"
            type="number"
            min="1"
            value={form.points}
            onChange={handleChange}
          />

          <button className="btn btn-primary" onClick={handleSubmit}>
            Create Event
          </button>

          {message && <p className="info-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}
