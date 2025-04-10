import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import "./Dashboard.css";

export default function TransactionList() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [adjustments, setAdjustments] = useState({});
  const [messages, setMessages] = useState({});

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/transactions", {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTransactions(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const handleSort = (field) => {
    const sorted = [...transactions].sort((a, b) =>
      a[field]?.toString().localeCompare(b[field]?.toString())
    );
    setTransactions(sorted);
  };

  const handleMarkSuspicious = async (id) => {
    try {
      await axios.patch(`http://localhost:8000/transactions/${id}`, {
        suspicious: true,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchTransactions();
      setMessages((prev) => ({ ...prev, [id]: "Marked as suspicious." }));
    } catch (err) {
      console.error("Failed to mark suspicious:", err);
      setMessages((prev) => ({ ...prev, [id]: "Error marking suspicious." }));
    }
  };

  const handleAdjustmentChange = (id, value) => {
    setAdjustments((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitAdjustment = async (id) => {
    try {
      const amount = parseFloat(adjustments[id]);
      if (isNaN(amount)) return;
      await axios.post(`http://localhost:8000/transactions/${id}/adjustment`, {
        amount,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setMessages((prev) => ({ ...prev, [id]: "Adjustment submitted." }));
      setAdjustments((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Failed to submit adjustment:", err);
      setMessages((prev) => ({ ...prev, [id]: "Error submitting adjustment." }));
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Transaction Management</h1>
          <h4 className="role-subheading">Mark suspicious or make adjustments</h4>
        </div>

        <div className="info-card">
          <table className="user-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")}>ID</th>
                <th onClick={() => handleSort("userId")}>User</th>
                <th onClick={() => handleSort("type")}>Type</th>
                <th onClick={() => handleSort("points")}>Points</th>
                <th onClick={() => handleSort("createdAt")}>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.userId}</td>
                  <td>{t.type}</td>
                  <td>{t.points}</td>
                  <td>{t.createdAt?.slice(0, 10)}</td>
                  <td>
                    <button onClick={() => handleMarkSuspicious(t.id)}>🚩 Suspicious</button>
                    <div style={{ marginTop: "8px" }}>
                      <input
                        type="number"
                        placeholder="Adjustment"
                        value={adjustments[t.id] || ""}
                        onChange={(e) => handleAdjustmentChange(t.id, e.target.value)}
                        style={{ marginRight: "5px", padding: "4px", width: "80px" }}
                      />
                      <button onClick={() => handleSubmitAdjustment(t.id)}>✓ Adjust</button>
                    </div>
                    {messages[t.id] && (
                      <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "4px" }}>
                        {messages[t.id]}
                      </p>
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
    </div>
  );
}
