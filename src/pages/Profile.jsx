import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/common/Toast";
import api from "../services/api";
import {
  ArrowLeft,
  Save,
  Sun,
  Moon,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Shield,
  Clock,
  Edit3,
  Check,
  X,
} from "lucide-react";

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Editable name
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);

  // Theme
  const [theme, setTheme] = useState(user?.themePreference || "dark");

  // Password
  const [showPassForm, setShowPassForm] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Activity
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    fetchActivity();
  }, []);

  useEffect(() => {
    setName(user?.name || "");
    setTheme(user?.themePreference || "dark");
  }, [user]);

  const fetchActivity = async () => {
    try {
      const { data } = await api.get("/rooms/recent");
      setRecentRooms(data.rooms?.slice(0, 5) || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (n) => {
    if (!n) return "?";
    return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user?.name) {
      setEditingName(false);
      setName(user?.name || "");
      return;
    }
    setSavingName(true);
    try {
      const { data } = await api.put("/auth/profile", { name: name.trim() });
      setUser(data.user);
      setEditingName(false);
      toast.success("Name updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleThemeToggle = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      const { data } = await api.put("/auth/theme", { themePreference: next });
      setUser(data.user);
      toast.success(`Theme switched to ${next}`);
    } catch (err) {
      setTheme(theme);
      toast.error("Failed to update theme");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass) {
      toast.warning("Fill in all password fields");
      return;
    }
    if (newPass.length < 6) {
      toast.warning("New password must be at least 6 characters");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPass(true);
    try {
      await api.put("/auth/password", { currentPassword: currentPass, newPassword: newPass });
      toast.success("Password changed successfully");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setShowPassForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPass(false);
    }
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="profile-page">
      <button className="btn btn-secondary" onClick={() => navigate("/dashboard")} style={{ marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* ─── Profile Header ─── */}
      <div className="profile-header">
        <div className="profile-avatar">{getInitials(user?.name)}</div>
        <div className="profile-info">
          {editingName ? (
            <div className="edit-name-row">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
              />
              <button className="btn btn-icon" onClick={handleSaveName} disabled={savingName}>
                <Check size={16} />
              </button>
              <button className="btn btn-icon" onClick={() => { setEditingName(false); setName(user?.name || ""); }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="edit-name-row">
              <h2>{user?.name}</h2>
              <button className="btn btn-icon btn-sm" onClick={() => setEditingName(true)} title="Edit name">
                <Edit3 size={14} />
              </button>
            </div>
          )}
          <div className="profile-meta">
            <span><Mail size={14} /> {user?.email}</span>
            <span><Shield size={14} style={{ textTransform: "capitalize" }} /> {user?.role}</span>
          </div>
        </div>
      </div>

      {/* ─── Settings ─── */}
      <div className="settings-section">
        <h3>Preferences</h3>

        {/* Theme Toggle */}
        <div className="setting-row">
          <div className="setting-label">
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
            <div>
              <strong>Theme</strong>
              <span className="setting-desc">Currently using {theme} mode</span>
            </div>
          </div>
          <button className={`theme-toggle ${theme === "light" ? "light" : ""}`} onClick={handleThemeToggle}>
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

      {/* ─── Security ─── */}
      <div className="settings-section">
        <h3>Security</h3>
        {!showPassForm ? (
          <button className="btn btn-secondary" onClick={() => setShowPassForm(true)}>
            <Lock size={16} /> Change Password
          </button>
        ) : (
          <div className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-input-wrapper">
                <Lock size={14} className="password-icon" />
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <Lock size={14} className="password-icon" />
                <input
                  type={showNew ? "text" : "password"}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Min 6 characters"
                />
                <button type="button" className="password-toggle" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-input-wrapper">
                <Lock size={14} className="password-icon" />
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={savingPass}>
                {savingPass ? <><span className="spinner-sm" /> Saving...</> : <><Save size={16} /> Update Password</>}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowPassForm(false); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Activity ─── */}
      <div className="settings-section">
        <h3>Recent Activity</h3>
        {recentRooms.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No recent sessions yet.</p>
        ) : (
          <div className="activity-list">
            {recentRooms.map((room) => (
              <div
                key={room._id}
                className="activity-item"
                onClick={() => navigate(`/room/${room.roomId}`)}
              >
                <div className="activity-icon">
                  <Clock size={14} />
                </div>
                <div className="activity-info">
                  <span className="activity-title">Room #{room.roomId}</span>
                  <span className="activity-time">{formatDate(room.createdAt)}</span>
                </div>
                <span className={`badge ${room.isActive ? "badge-active" : "badge-inactive"}`}>
                  {room.isActive ? "Active" : "Closed"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
