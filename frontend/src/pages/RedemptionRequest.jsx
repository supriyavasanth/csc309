import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";
import "./Login.css";

export default function RedeemPointsPage() {
  const { token, user } = useAuth();
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const points = parseInt(amount);

    if (!points || points <= 0) {
      setMessage("Please enter a valid number of points.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/transactions",
        {
          type: "redeem",
          amount: points,
          remark: remark || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setMessage("Redemption request successful!");
      setAmount("");
      setRemark("");
    } catch (err) {
      console.error("Redemption failed:", err);
      setMessage("Failed to redeem points. Please try again.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Redeem Points</h2>
        <p>You currently have <strong>{user.points ?? 0}</strong> points.</p>

        <form className="form-card" onSubmit={handleSubmit}>
          <label>Amount to Redeem:</label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <label>Remark (optional):</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          <button type="submit" className="primary-btn">Submit Redemption</button>

          {message && <p className="info-message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
