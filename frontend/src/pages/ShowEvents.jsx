import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";

export default function PublishedEventsPage() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:8000/events", {
          params: { published: true },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setEvents(res.data.results);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };

    fetchEvents();
  }, [token]);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Published Events</h2>
        {events.length === 0 ? (
          <p>No published events available.</p>
        ) : (
          <ul className="promotion-list">
            {events.map((event) => (
              <li key={event.id} className="info-card">
                <h4>{event.name}</h4>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Start:</strong> {event.startTime?.slice(0, 10)}</p>
                <p><strong>End:</strong> {event.endTime?.slice(0, 10)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
