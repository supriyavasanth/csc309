import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";

export default function CreateTransactionPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    utorid: "",
    type: "purchase",
    spent: "",
    promotionIds: [],
    remark: ""
  });
  const [message, setMessage] = useState("");
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await axios.get("http://localhost:8000/promotions", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setPromotions(res.data.results || []);
      } catch (err) {
        console.error("Failed to load promotions:", err);
      }
    };
    fetchPromotions();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePromotionChange = (e) => {
    const options = Array.from(e.target.selectedOptions).map((o) => parseInt(o.value));
    setForm((prev) => ({ ...prev, promotionIds: options }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(
        "http://localhost:8000/transactions",
        {
          utorid: form.utorid,
          type: "purchase",
          spent: parseFloat(form.spent),
          promotionIds: form.promotionIds,
          remark: form.remark
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setMessage("Transaction created successfully!");
      setForm({
        utorid: "",
        type: "purchase",
        spent: "",
        promotionIds: [],
        remark: ""
      });
    } catch (err) {
      console.error("Transaction failed:", err);
      setMessage("Failed to create transaction.");
    }
  };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Create Purchase Transaction</h2>

        <form className="form-card" onSubmit={handleSubmit}>
          <label>Customer UTORid</label>
          <input
            name="utorid"
            value={form.utorid}
            onChange={handleChange}
            required
          />

          <label>Amount Spent ($)</label>
          <input
            name="spent"
            type="number"
            min="0.01"
            step="0.01"
            value={form.spent}
            onChange={handleChange}
            required
          />

          <label>Apply Promotions (optional)</label>
          <select
            multiple
            value={form.promotionIds.map((id) => id.toString())}
            onChange={handlePromotionChange}
          >
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <label>Remark (optional)</label>
          <input
            name="remark"
            value={form.remark}
            onChange={handleChange}
          />

          <button type="submit" className="btn btn-primary">Submit Transaction</button>
        </form>

        {message && <p className="info-message">{message}</p>}
      </div>
    </div>
  );
}
    