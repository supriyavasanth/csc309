import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import "./UserList.css";

export default function UserList() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    role: "",
    verified: "",
    activated: ""
  });
  const [sortBy, setSortBy] = useState("id");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/users", {
        params: { ...filters, page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUsers(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters, page]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSort = (field) => {
    const sorted = [...users].sort((a, b) =>
      a[field]?.toString().localeCompare(b[field]?.toString())
    );
    setUsers(sorted);
    setSortBy(field);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">User List</h1>
          <h4 className="role-subheading">Manage and view registered users</h4>
        </div>

        <div className="filters" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input name="name" placeholder="Search name or utorid" onChange={handleChange} />
          <select name="role" onChange={handleChange}>
            <option value="">All Roles</option>
            <option value="REGULAR">Regular</option>
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
            <option value="SUPERUSER">Superuser</option>
          </select>
          <select name="verified" onChange={handleChange}>
            <option value="">Verified?</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select name="activated" onChange={handleChange}>
            <option value="">Activated?</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {users.length === 0 ? (
          <p className="muted">No users found.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("name")}>Name</th>
                <th onClick={() => handleSort("utorid")}>UTORid</th>
                <th onClick={() => handleSort("email")}>Email</th>
                <th onClick={() => handleSort("role")}>Role</th>
                <th onClick={() => handleSort("verified")}>Verified</th>
                <th onClick={() => handleSort("createdAt")}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.utorid}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.verified ? "Yes" : "No"}</td>
                  <td>{u.createdAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}
