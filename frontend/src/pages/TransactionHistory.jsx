import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";
import "./Dashboard.css";

export default function TransactionHistory() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    type: "",
    createdBy: "",
    suspicious: "",
    promotionId: "",
    relatedId: "",
    amount: "",
    operator: "",
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchTransactions = async () => {
    try {
      const params = {
        ...filters,
        page,
        limit,
        sortBy,
      };
      Object.keys(params).forEach((key) => {
        if (params[key] === "") delete params[key];
      });

      const res = await axios.get("http://localhost:8000/users/me/transactions", {
        params,
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
  }, [filters, page, sortBy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Transaction History</h1>
          <h4 className="role-subheading">View and filter your past activity</h4>
        </div>

        <div className="info-card">
          <div className="filters" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <input name="name" placeholder="Name or UTORid" onChange={handleChange} />
            <input name="createdBy" placeholder="Created By" onChange={handleChange} />
            <select name="suspicious" onChange={handleChange}>
              <option value="">Suspicious?</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
            <input name="promotionId" type="number" placeholder="Promotion ID" onChange={handleChange} />
            <input name="relatedId" type="number" placeholder="Related ID" onChange={handleChange} />
            <select name="type" value={filters.type} onChange={handleChange}>
              <option value="">All Types</option>
              <option value="earn">Earn</option>
              <option value="redeem">Redeem</option>
              <option value="transfer">Transfer</option>
              <option value="event">Event</option>
            </select>
            <input name="amount" type="number" placeholder="Point amount" onChange={handleChange} />
            <select name="operator" onChange={handleChange}>
              <option value="">Operator</option>
              <option value="gte">≥</option>
              <option value="lte">≤</option>
            </select>
          </div>

          {transactions.length === 0 ? (
            <p className="muted">No transactions found.</p>
          ) : (
            <div className="list" style={{ gap: "1rem" }}>
              {transactions.map((t) => (
                <div className="transaction-card info-card" key={t.id}>
                  <p><strong>Type:</strong> {t.type}</p>
                  <p><strong>Points:</strong> {t.points}</p>
                  {t.type === "transfer" && (
                    <p><strong>{t.direction === "outgoing" ? "To" : "From"}:</strong> {t.otherUserName} ({t.otherUserUtorid})</p>
                  )}
                  {t.type === "event" && <p><strong>Event ID:</strong> {t.relatedId}</p>}
                  {t.remark && <p><strong>Note:</strong> {t.remark}</p>}
                  {t.promotionId && <p><strong>Promo ID:</strong> {t.promotionId}</p>}
                  {t.suspicious && <p style={{ color: "red" }}><strong>⚠️ Suspicious</strong></p>}
                  <p><strong>Date:</strong> {new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

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
