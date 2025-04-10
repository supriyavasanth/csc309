import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./UserList.css";

export default function EventManagement() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUserIds, setSelectedUserIds] = useState({}); // per-event selected user to add
  const [removeUserIds, setRemoveUserIds] = useState({}); // per-event selected user to remove

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:8000/events", {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const enriched = await Promise.all(
        res.data.results.map(async (event) => {
          const detail = await axios.get(`http://localhost:8000/events/${event.id}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          return { ...event, guests: detail.data.guests || [] };
        })
      );

      setEvents(enriched);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAllUsers(res.data.results);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchAllUsers();
  }, [page]);

  const handleAddUser = async (eventId) => {
    const utorid = selectedUserIds[eventId];
    if (!utorid) return;
  
    try {
      const res = await axios.post(
        `http://localhost:8000/events/${eventId}/guests`,
        { utorid },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
  
      const newGuest = res.data.guestAdded;
  
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === eventId
            ? {
                ...e,
                guests: [...e.guests, newGuest],
              }
            : e
        )
      );
  
      setSelectedUserIds((prev) => ({ ...prev, [eventId]: "" }));
    } catch (err) {
      console.error("Failed to add guest:", err);
    }
  };
  

  const handleRemoveUser = async (eventId) => {
    const userId = removeUserIds[eventId];
    if (!userId) return;
    try {
      await axios.delete(`http://localhost:8000/events/${eventId}/guests/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchEvents();
    } catch (err) {
      console.error("Failed to remove guest:", err);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Event Attendees Management</h2>

        <table className="user-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Attendees</th>
              <th>Add User</th>
              <th>Remove User</th>
            </tr>
          </thead>
          <tbody>
  {events.map((event) => {
    const guestIds = new Set(event.guests.map((g) => g.id));
    const notGuests = allUsers.filter((u) => !guestIds.has(u.id));
    return (
      <tr key={event.id}>
        <td>{event.name}</td>
        <td>{event.guests.length}</td> {/* Optional: show count of attendees */}
        <td>
          <select
            value={selectedUserIds[event.id] || ""}
            onChange={(e) =>
              setSelectedUserIds((prev) => ({
                ...prev,
                [event.id]: e.target.value,
              }))
            }
          >
            <option value="">Select user</option>
            {notGuests.map((u) => (
              <option key={u.id} value={u.utorid}>
                {u.name} ({u.utorid})
              </option>
            ))}
          </select>
          <button onClick={() => handleAddUser(event.id)}>Add</button>
        </td>
        <td>
          <select
            value={removeUserIds[event.id] || ""}
            onChange={(e) =>
              setRemoveUserIds((prev) => ({
                ...prev,
                [event.id]: e.target.value,
              }))
            }
          >
            <option value="">Select attendee</option>
            {allUsers
            .filter((u) => event.guests.some((g) => g.id === u.id))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.utorid})
              </option>
          ))}

          </select>
          <button onClick={() => handleRemoveUser(event.id)}>Remove</button>
        </td>
      </tr>
    );
  })}
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
