import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./Dashboard.css";

export default function RSVPEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [rsvpedEventIds, setRsvpedEventIds] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:8000/events", {
        params: { published: true, page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setEvents(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  const fetchUserRsvps = async () => {
    try {
      const res = await axios.get("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setRsvpedEventIds(res.data.rsvpEventIds || []);
    } catch (err) {
      console.error("Failed to load RSVPs:", err);
    }
  };

  const handleRSVP = async (eventId) => {
    try {
      await axios.post(
        `http://localhost:8000/events/${eventId}/guests/me`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setRsvpedEventIds((prev) => [...prev, eventId]);
    } catch (err) {
      console.error("Failed to RSVP:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUserRsvps();
  }, [page]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">RSVP to Events</h1>
          <h4 className="role-subheading">Browse and RSVP to upcoming events</h4>
        </div>

        <div className="info-card">
          {events.length === 0 ? (
            <p className="muted">No available events to RSVP.</p>
          ) : (
            <>
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td>{e.location}</td>
                      <td>{e.startTime?.slice(0, 10)}</td>
                      <td>{e.endTime?.slice(0, 10)}</td>
                      <td>
                        {rsvpedEventIds.includes(e.id) ? (
                          <span className="tag success">RSVP'd</span>
                        ) : (
                          <button className="small-primary-btn" onClick={() => handleRSVP(e.id)}>
                            RSVP
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
