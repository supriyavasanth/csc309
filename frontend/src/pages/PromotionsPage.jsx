import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";
import "./Dashboard.css";

export default function PromotionList() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [filters, setFilters] = useState({ name: "", type: "", minSpending: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchPromotions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/promotions", {
        params: { ...filters, page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setPromotions(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to load promotions:", err);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [filters, page]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSort = (field) => {
    const sorted = [...promotions].sort((a, b) =>
      a[field]?.toString().localeCompare(b[field]?.toString())
    );
    setPromotions(sorted);
    setSortBy(field);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Promotion Management</h1>
          <h4 className="role-subheading">Browse and filter promotions</h4>
        </div>

        <div className="info-card">
          <div className="filters" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input name="name" placeholder="Search name" onChange={handleChange} />
            <select name="type" onChange={handleChange}>
              <option value="">All Types</option>
              <option value="automatic">Automatic</option>
              <option value="one-time">One-time</option>
            </select>
            <input
              name="minSpending"
              type="number"
              min="0"
              step="0.01"
              placeholder="Min Spending"
              onChange={handleChange}
            />
          </div>

          <table className="user-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("name")}>Name</th>
                <th onClick={() => handleSort("type")}>Type</th>
                <th onClick={() => handleSort("points")}>Points</th>
                <th onClick={() => handleSort("rate")}>Rate</th>
                <th onClick={() => handleSort("minSpending")}>Min Spending</th>
                <th onClick={() => handleSort("createdAt")}>Created</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.type}</td>
                  <td>{p.points ?? "-"}</td>
                  <td>{p.rate ?? "-"}</td>
                  <td>{p.minSpending ? `$${p.minSpending}` : "-"}</td>
                  <td>{p.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination" style={{ marginTop: "1rem" }}>
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
    </div>
  );
}
