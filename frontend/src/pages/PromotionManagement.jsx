import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/useAuth";
import Sidebar from "../layout/Sidebar";

export default function PromotionDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState(null);
  const [form, setForm] = useState({
    name: "",
    points: "",
    rate: "",
    type: "",
    minSpending: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/promotions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setPromotion(res.data);
        setForm({
          name: res.data.name || "",
          points: res.data.points || "",
          rate: res.data.rate || "",
          type: res.data.type || "",
          minSpending: res.data.minSpending || ""
        });
      } catch (err) {
        console.error("Failed to fetch promotion:", err);
        setMessage("Error loading promotion.");
      }
    };
    fetchPromotion();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await axios.patch(`http://localhost:8000/promotions/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setMessage("Promotion updated successfully.");
    } catch (err) {
      console.error("Failed to update promotion:", err);
      setMessage("Failed to update.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await axios.delete(`http://localhost:8000/promotions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      navigate("/promotions");
    } catch (err) {
      console.error("Failed to delete promotion:", err);
      setMessage("Delete failed.");
    }
  };

  if (!promotion) {
    return (
      <div className="page-layout">
        <Sidebar />
        <div className="page-content"><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Promotion #{promotion.id}</h2>

        <div className="promotion-detail-form">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} />

          <label>Points</label>
          <input name="points" type="number" value={form.points} onChange={handleChange} />

          <label>Rate</label>
          <input name="rate" type="number" value={form.rate} onChange={handleChange} />

          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="">Select Type</option>
            <option value="BONUS">Bonus</option>
            <option value="REWARD">Reward</option>
            <option value="LIMITED">Limited</option>
          </select>

          <label>Min Spending</label>
          <input
            name="minSpending"
            type="number"
            value={form.minSpending}
            onChange={handleChange}
          />

          <button className="btn btn-primary" onClick={handleUpdate}>Update</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>

          {message && <p className="info-message">{message}</p>}
        </div>
      </div>
    </div>
  );
}
