import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import "./UserList.css"; // You can reuse or create TransactionList.css

export default function TransactionList() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    userId: "",
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:8000/transactions", {
        params: { ...filters, page, limit },
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
  }, [filters, page]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1);
  };

  const handleSort = (field) => {
    const sorted = [...transactions].sort((a, b) =>
      a[field]?.toString().localeCompare(b[field]?.toString())
    );
    setTransactions(sorted);
    setSortBy(field);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Transaction History</h2>

        <div className="filters">
          <select name="type" onChange={handleChange}>
            <option value="">All Types</option>
            <option value="EARN">Earn</option>
            <option value="REDEEM">Redeem</option>
            <option value="TRANSFER">Transfer</option>
          </select>
          <input
            name="userId"
            placeholder="Search by User ID"
            onChange={handleChange}
          />
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID</th>
              <th onClick={() => handleSort("userId")}>User</th>
              <th onClick={() => handleSort("type")}>Type</th>
              <th onClick={() => handleSort("points")}>Points</th>
              <th onClick={() => handleSort("createdAt")}>Created</th>
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
