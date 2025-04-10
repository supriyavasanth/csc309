import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import "./Dashboard.css";

export default function ProfilePage() {
  const { token } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    birthday: "",
    oldPassword: "",
    newPassword: ""
  });
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setUserInfo(res.data);
        setForm({
          name: res.data.name || "",
          birthday: res.data.birthday?.slice(0, 10) || "",
          oldPassword: "",
          newPassword: ""
        });
      } catch (err) {
        console.error("Failed to load user", err);
      }
    };
    fetchUser();
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileUpdate = async () => {
    try {
      await axios.patch(
        "http://localhost:8000/users/me",
        { name: form.name, birthday: form.birthday },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setUserInfo((prev) => ({
        ...prev,
        name: form.name,
        birthday: form.birthday,
      }));
      setMessage("Profile updated.");
      setEditMode(false);
    } catch (err) {
      setMessage("Error updating profile.");
      console.error(err);
    }
  };

  const handlePasswordUpdate = async () => {
    const passwordValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/.test(
      form.newPassword
    );

    if (!form.oldPassword || !form.newPassword) {
      setMessage("Please fill in both password fields.");
      return;
    }

    if (!passwordValid) {
      setPasswordError(
        "Password must include: 8–20 characters, at least one uppercase, one lowercase, one number, one special character"
      );
      return;
    } else {
      setPasswordError("");
    }

    try {
      await axios.patch(
        "http://localhost:8000/users/me/password",
        {
          old: form.oldPassword,
          new: form.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setMessage("Password updated.");
      setForm((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
      }));
    } catch (err) {
      const msg = err?.response?.data?.error || "Error updating password.";
      setMessage(msg);
      console.error(err);
    }
  };

  if (!userInfo) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-content">
          <h2 className="title">Profile Management</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="welcome-heading">Profile Management</h1>
          <h4 className="role-subheading">Edit your details and password</h4>
        </div>

        <div className="dashboard-body">
          <div className="info-card">
            {!editMode ? (
              <>
                <p><strong>Name:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Birthday:</strong> {userInfo.birthday?.slice(0, 10) || "Not set"}</p>
                <button className="small-primary-btn" onClick={() => setEditMode(true)}>Edit</button>
              </>
            ) : (
              <>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />

                <label>Email</label>
                <input
                  type="text"
                  value={userInfo.email || ""}
                  disabled
                />

                <label>Birthday</label>
                <input
                  type="date"
                  name="birthday"
                  value={form.birthday}
                  onChange={handleChange}
                />

                <button className="small-primary-btn" onClick={handleProfileUpdate}>
                  Save Changes
                </button>

                <label>Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={form.oldPassword}
                  onChange={handleChange}
                />

                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                />
                {passwordError && <p className="error-message">{passwordError}</p>}

                <button className="small-primary-btn" onClick={handlePasswordUpdate}>
                  Change Password
                </button>
              </>
            )}

            {message && <p className="info-message">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
