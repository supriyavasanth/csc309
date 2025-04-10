import React, { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import CreateUserForm from "../components/CreateUserForm";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) return;

      try {
        if (user.role === "REGULAR") {
          const res = await axios.get("http://localhost:8000/users/me/transactions", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          setTransactions(res.data.slice(0, 5));
        }

        if (["MANAGER", "SUPERUSER"].includes(user.role)) {
          const [eventsRes, promotionsRes, usersRes] = await Promise.all([
            axios.get("http://localhost:8000/events", {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }),
            axios.get("http://localhost:8000/promotions", {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }),
            axios.get("http://localhost:8000/users", {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }),
          ]);
          setEvents(eventsRes.data.results?.slice(0, 5) || []);
          setPromotions(promotionsRes.data.results?.slice(0, 5) || []);
          setUsers(usersRes.data.results?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      }
    };

    fetchData();
  }, [token, user]);

  if (!user) return null;

  const toggleCreateUser = () => setShowCreateUser(prev => !prev);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">
            Welcome, {user.name?.trim() || user.utorid || "User"}!
          </h1>
          <h4 className="role-subheading">{user.role} Dashboard</h4>
        </div>

        <div className="dashboard-body">
          {user.role === "REGULAR" && (
            <div className="info-card">
              <h3>Your Points</h3>
              <p className="big-number">{user.points ?? 0} points</p>
              <h4 style={{ marginTop: "1rem" }}>Recent Transactions</h4>
              {transactions.length === 0 ? (
                <p className="muted">No recent transactions.</p>
              ) : (
                <div className="list">
                  {transactions.map((t) => (
                    <div key={t.id}>
                      {t.type} {t.points} points on {t.createdAt?.slice(0, 10)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role === "CASHIER" && (
            <div className="info-card">
              <h3>Cashier Panel</h3>
              <div>Create purchase transactions and process redemptions.</div>
            </div>
          )}

          {["MANAGER", "SUPERUSER"].includes(user.role) && (
            <>
              <div className="card-grid">
                <div className="card">
                  <h3>Recent Users</h3>
                  {users.length === 0 ? (
                    <p className="muted">No users found.</p>
                  ) : (
                    <div className="list">
                      {users.map((u) => (
                        <div key={u.id}>{u.name || u.utorid}</div>
                      ))}
                    </div>
                  )}
                  <button className="small-primary-btn" onClick={toggleCreateUser}>
                    {showCreateUser ? "Close" : "Create New User"}
                  </button>
                  {showCreateUser && (
                    <div className="form-card">
                      <CreateUserForm />
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3>Recent Promotions</h3>
                  {promotions.length === 0 ? (
                    <p className="muted">No promotions available.</p>
                  ) : (
                    <div className="list">
                      {promotions.map((p) => (
                        <div key={p.id}>{p.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Recent Events</h3>
                {events.length === 0 ? (
                  <p className="muted">No events found.</p>
                ) : (
                  <div className="list">
                    {events.map((e) => (
                      <div key={e.id}>{e.name}</div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
