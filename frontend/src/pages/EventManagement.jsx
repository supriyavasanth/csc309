import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./UserList.css";

export default function EventManagement() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    capacity: "",
    points: "",
    published: "false",
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:8000/events", {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setEvents(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page]);

  const startEditing = (event) => {
    setEditingEvent(event.id);
    setEditForm({
      name: event.name,
      description: event.description,
      location: event.location,
      capacity: event.capacity || "",
      points: event.pointsRemain + event.pointsAwarded || "",
      published: event.published ? "true" : "false",
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (id) => {
    const payload = {};
    if (editForm.name) payload.name = editForm.name;
    if (editForm.description) payload.description = editForm.description;
    if (editForm.location) payload.location = editForm.location;
    if (editForm.capacity) payload.capacity = Number(editForm.capacity);
    if (editForm.points) payload.points = Number(editForm.points);
    if (editForm.published === "true") payload.published = true;

    try {
      await axios.patch(`http://localhost:8000/events/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error("Failed to update event:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`http://localhost:8000/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Event Management</h2>

        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Start</th>
              <th>End</th>
              <th>Capacity</th>
              <th>Points</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  {editingEvent === e.id ? (
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                    />
                  ) : (
                    e.name
                  )}
                </td>
                <td>
                  {editingEvent === e.id ? (
                    <input
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                    />
                  ) : (
                    e.location
                  )}
                </td>
                <td>{e.startTime?.slice(0, 10)}</td>
                <td>{e.endTime?.slice(0, 10)}</td>
                <td>
                  {editingEvent === e.id ? (
                    <input
                      name="capacity"
                      type="number"
                      value={editForm.capacity}
                      onChange={handleEditChange}
                    />
                  ) : (
                    e.capacity ?? "∞"
                  )}
                </td>
                <td>
                  {editingEvent === e.id ? (
                    <input
                      name="points"
                      type="number"
                      value={editForm.points}
                      onChange={handleEditChange}
                    />
                  ) : (
                    e.pointsRemain
                  )}
                </td>
                <td>
                  {editingEvent === e.id ? (
                    e.published ? (
                      "Yes"
                    ) : (
                      <select
                        name="published"
                        value={editForm.published}
                        onChange={handleEditChange}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    )
                  ) : e.published ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </td>
                <td>
                  {editingEvent === e.id ? (
                    <button onClick={() => handleUpdate(e.id)}>Save</button>
                  ) : (
                    <>
                      <button onClick={() => startEditing(e)}>Edit</button>
                      <button onClick={() => handleDelete(e.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
