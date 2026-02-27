import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/common/Toast";
import api from "../services/api";
import {
  Plus,
  LogOut,
  User,
  X,
  Lock,
  Eye,
  EyeOff,
  LayoutDashboard,
  Zap,
  CalendarDays,
  ArrowRight,
  BookOpen,
  Layers,
} from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ totalRooms: 0, activeRooms: 0, thisWeek: 0 });
  const [joinId, setJoinId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showJoinPass, setShowJoinPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create room modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchStats();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get("/rooms/recent");
      setRooms(data.rooms);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/rooms/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleCreate = async () => {
    if (!createPassword || createPassword.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const { data } = await api.post("/rooms/create", { password: createPassword });
      setShowCreateModal(false);
      setCreatePassword("");
      toast.success("Room created successfully!");
      navigate(`/room/${data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinId.trim()) {
      toast.warning("Enter a Room ID to join");
      return;
    }
    if (!joinPassword) {
      setError("Room password is required");
      return;
    }
    setError("");
    try {
      await api.post("/rooms/join", { roomId: joinId.trim(), password: joinPassword });
      toast.success("Joined room successfully!");
      setJoinId("");
      setJoinPassword("");
      navigate(`/room/${joinId.trim()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join room");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info("Logged out");
    navigate("/");
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="dashboard">
      {/* ─── Nav ─── */}
      <nav className="dashboard-nav">
        <div className="logo">CollabBoard AI</div>
        <div className="nav-right">
          <Link to="/docs" className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
            <BookOpen size={15} /> Docs
          </Link>
          <button
            className="btn btn-icon"
            onClick={() => navigate("/profile")}
            title="Profile"
          >
            <User size={18} />
          </button>
          <button className="btn btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* ─── Welcome ─── */}
        <div className="dashboard-welcome">
          <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p>Manage your collaborative workspaces and sessions.</p>
        </div>

        {/* ─── Stats ─── */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Layers size={20} />
            </div>
            <div className="stat-label">Total Rooms</div>
            <div className="stat-value">{stats.totalRooms}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
              <Zap size={20} />
            </div>
            <div className="stat-label">Active Sessions</div>
            <div className="stat-value">{stats.activeRooms}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <CalendarDays size={20} />
            </div>
            <div className="stat-label">This Week</div>
            <div className="stat-value">{stats.thisWeek}</div>
          </div>
        </div>

        {/* ─── Action Cards ─── */}
        {error && <div className="error-msg">{error}</div>}

        <div className="action-grid">
          {/* Create Room */}
          <div className="action-card create-card">
            <h3>✨ Create New Room</h3>
            <p>Start a new collaborative whiteboard session. Invite others with the room ID and password.</p>
            <button
              className="btn btn-gradient"
              onClick={() => { setShowCreateModal(true); setError(""); }}
            >
              <Plus size={18} /> Create Room
            </button>
          </div>

          {/* Join Room */}
          <div className="action-card">
            <h3>🔗 Join a Room</h3>
            <p>Enter a Room ID and password to join an existing session.</p>
            <div className="join-group">
              <input
                className="input"
                type="text"
                placeholder="Enter Room ID"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
              />
              <div className="join-row">
                <div className="password-input-wrapper">
                  <Lock size={14} className="password-icon" />
                  <input
                    className="input"
                    type={showJoinPass ? "text" : "password"}
                    placeholder="Room Password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowJoinPass(!showJoinPass)}
                  >
                    {showJoinPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button className="btn btn-primary" onClick={handleJoin}>
                  <ArrowRight size={16} /> Join
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Create Modal ─── */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🛡️ Create Protected Room</h3>
                <button className="modal-close" onClick={() => { setShowCreateModal(false); setCreatePassword(""); setError(""); }}>
                  <X size={18} />
                </button>
              </div>
              <p className="modal-desc">Set a password for your new room. Share it with collaborators.</p>
              <div className="modal-field">
                <label>Room Password</label>
                <div className="password-input-wrapper">
                  <Lock size={14} className="password-icon" />
                  <input
                    type={showCreatePass ? "text" : "password"}
                    placeholder="Min 4 characters"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    autoFocus
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowCreatePass(!showCreatePass)}>
                    {showCreatePass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button
                className="btn btn-gradient btn-full"
                onClick={handleCreate}
                disabled={creating}
                style={{ marginTop: 8 }}
              >
                {creating ? <><span className="spinner-sm" /> Creating...</> : "Create Room"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Recent Rooms ─── */}
        <div className="recent-header">
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Recent Sessions</h2>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ height: 200 }}>
            <div className="spinner" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <LayoutDashboard size={36} />
            </div>
            <h3>No sessions yet</h3>
            <p>Create your first collaborative workspace to get started.</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="room-card"
                onClick={() => navigate(`/room/${room.roomId}`)}
              >
                <div className="room-id">#{room.roomId}</div>
                <div className="room-status">
                  <span className={`dot ${room.isActive ? "" : "inactive"}`} />
                  {room.isActive ? "Active" : "Inactive"}
                </div>
                <div className="room-meta">
                  <span>Host: {room.host?.name}</span>
                  <span>{room.participants?.length || 0} members</span>
                </div>
                <div className="room-meta">
                  <span>{formatDate(room.createdAt)}</span>
                </div>
                <button className="room-view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/room/${room.roomId}`); }}>
                  View Room →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
