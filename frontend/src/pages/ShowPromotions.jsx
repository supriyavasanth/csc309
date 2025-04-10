import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";

export default function AvailablePromotionsPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await axios.get("http://localhost:8000/promotions", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setPromotions(res.data.results);
      } catch (err) {
        console.error("Failed to fetch promotions:", err);
      }
    };

    fetchPromotions();
  }, [token]);

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Available Promotions</h2>
        {promotions.length === 0 ? (
          <p>No promotions found.</p>
        ) : (
          <ul className="promotion-list">
            {promotions.map((promo) => (
              <li key={promo.id} className="info-card">
                <h4>{promo.name}</h4>
                <p><strong>Points Required:</strong> {promo.points}</p>
                <p><strong>Details:</strong> {promo.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
