import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./Dashboard.css";

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
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Available Promotions</h1>
          <h4 className="role-subheading">Here are your current offers and rewards</h4>
        </div>

        <div className="info-card">
          {promotions.length === 0 ? (
            <p className="muted">No promotions found.</p>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promo) => (
                  <tr key={promo.id}>
                    <td>{promo.name}</td>
                    <td>{promo.description}</td>
                    <td>{promo.points ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
