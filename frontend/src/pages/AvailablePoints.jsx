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

  if (loading) return <div className="page-layout"><Sidebar /><div className="page-content"><p>Loading...</p></div></div>;
  if (!userData) return <div className="page-layout"><Sidebar /><div className="page-content"><p>Unable to load user data.</p></div></div>;

  const displayName = userData.name || userData.utorid;
  const availablePoints = Number(userData.points) || 0;

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <h2 className="title">Available Points</h2>

        <div className="info-card">
          <p>
            Hello, <strong>{displayName}</strong>!
          </p>
          <p>
            You currently have <strong>{availablePoints}</strong> points available.
          </p>
        </div>
      </div>
    </div>
  );
}
