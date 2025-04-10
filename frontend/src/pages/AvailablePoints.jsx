import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { useAuth } from "../context/useAuth";
import "./Dashboard.css";

export default function AvailablePoints() {
  const { token } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUserData(res.data);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [token]);

  if (loading || !userData) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <p>{loading ? "Loading..." : "Unable to load user data."}</p>
        </div>
      </div>
    );
  }

  const displayName = userData.name?.trim() || userData.utorid;
  const availablePoints = Number(userData.points) || 0;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Welcome, {displayName}!</h1>
          <h4 className="role-subheading">Points Summary</h4>
        </div>

        <div className="dashboard-body">
          <div className="info-card">
            <h3>Available Points</h3>
            <p className="big-number">{availablePoints} points</p>
          </div>
        </div>
      </div>
    </div>
  );
}
