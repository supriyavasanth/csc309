import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import "./UserList.css";

export default function UserList() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: "",
    verified: "",
    role: ""
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/users", {
        params: { page, limit },
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
  }, [page]);

  const startEditing = (user) => {
    setErrorMsg("");
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      role: user.role,
      verified: user.verified.toString()
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = (id) => {
    const user = users.find((u) => u.id === id);
    if (!user?.verified) {
      setErrorMsg("Cannot edit or update an unverified user.");
      return;
    }

    const payload = {};
    if (editForm.email?.trim()) payload.email = editForm.email.trim();
    if (editForm.verified !== "") payload.verified = editForm.verified === "true";
    if (editForm.role?.trim()) payload.role = editForm.role.toUpperCase();

    if (Object.keys(payload).length === 0) {
      setErrorMsg("No changes detected.");
      return;
    }

    setErrorMsg("This is a verified user. Form is valid. (No request sent as per instructions)");
    setEditingUser(null);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">User Management</h1>
          <h4 className="role-subheading">View, edit, and manage users</h4>
        </div>

        {errorMsg && <div className="error-msg" style={{ color: "red", marginBottom: "10px" }}>{errorMsg}</div>}

        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>UTORid</th>
              <th>Email</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.utorid}</td>
                <td>
                  {editingUser === u.id ? (
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                    />
                  ) : (
                    u.email
                  )}
                </td>
                <td>
                  {editingUser === u.id ? (
                    <select name="role" value={editForm.role} onChange={handleEditChange}>
                      <option value="REGULAR">Regular</option>
                      <option value="CASHIER">Cashier</option>
                      <option value="MANAGER">Manager</option>
                      <option value="SUPERUSER">Superuser</option>
                    </select>
                  ) : (
                    u.role
                  )}
                </td>
                <td>
                  {editingUser === u.id ? (
                    <select name="verified" value={editForm.verified} onChange={handleEditChange}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    u.verified ? "Yes" : "No"
                  )}
                </td>
                <td>{u.createdAt?.slice(0, 10)}</td>
                <td>
                  {editingUser === u.id ? (
                    <button onClick={() => handleUpdate(u.id)}>Save</button>
                  ) : (
                    <button onClick={() => startEditing(u)}>Edit</button>
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
