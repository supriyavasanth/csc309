import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";

export default function EventList() {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    location: "",
    published: ""
  });
  const [sortBy, setSortBy] = useState("startTime");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:8000/events", {
        params: { ...filters, page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setEvents(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters, page]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSort = (field) => {
    const sorted = [...events].sort((a, b) =>
      a[field]?.toString().localeCompare(b[field]?.toString())
    );
    setEvents(sorted);
    setSortBy(field);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Events</h2>

        <div className="filters">
          <input name="name" placeholder="Search by name" onChange={handleChange} />
          <input name="location" placeholder="Search by location" onChange={handleChange} />
          <select name="published" onChange={handleChange}>
            <option value="">Published?</option>
            <option value="true">Published</option>
            <option value="false">Unpublished</option>
          </select>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>Name</th>
              <th onClick={() => handleSort("location")}>Location</th>
              <th onClick={() => handleSort("startTime")}>Start</th>
              <th onClick={() => handleSort("endTime")}>End</th>
              <th onClick={() => handleSort("capacity")}>Capacity</th>
              <th onClick={() => handleSort("pointsRemain")}>Points Left</th>
              <th onClick={() => handleSort("published")}>Published</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.location}</td>
                <td>{e.startTime?.slice(0, 16).replace("T", " ")}</td>
                <td>{e.endTime?.slice(0, 16).replace("T", " ")}</td>
                <td>{e.capacity ?? "∞"}</td>
                <td>{e.pointsRemain}</td>
                <td>{e.published ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
