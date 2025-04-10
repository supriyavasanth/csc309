import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";

export default function TransactionHistory() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/users/me/transactions", {
        params: {
          type: typeFilter || undefined,
          page,
          limit,
          sortBy,
        },
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
  }, [typeFilter, page, sortBy]);

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Your Transaction History</h2>

        <div className="filters">
          <label>Filter by type: </label>
          <select value={typeFilter} onChange={handleTypeChange}>
            <option value="">All</option>
            <option value="earn">Earn</option>
            <option value="redeem">Redeem</option>
            <option value="transfer">Transfer</option>
            <option value="event">Event</option>
          </select>
        </div>

        {transactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          <div className="transaction-list">
            {transactions.map((t) => (
              <div className={`transaction-card ${t.type}`} key={t.id}>
                <p><strong>Type:</strong> {t.type}</p>
                <p><strong>Points:</strong> {t.points}</p>
                {t.type === "transfer" && (
                  <p>
                    <strong>{t.direction === "outgoing" ? "To" : "From"}:</strong> {t.otherUserName} ({t.otherUserUtorid})
                  </p>
                )}
                {t.type === "event" && (
                  <p><strong>Event ID:</strong> {t.relatedId}</p>
                )}
                {t.remark && <p><strong>Note:</strong> {t.remark}</p>}
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
  );
}
