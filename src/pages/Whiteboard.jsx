import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import api from "../services/api";
import Canvas from "../components/canvas/Canvas";
import Toolbar from "../components/canvas/Toolbar";
import StickyNote, { STICKY_COLORS } from "../components/canvas/StickyNote";
import ChatPanel from "../components/chat/ChatPanel";
import AIPanel from "../components/ai/AIPanel";
import ReplayBar from "../components/replay/ReplayBar";
import TemplateLibrary from "../components/canvas/TemplateLibrary";
import {
  MessageSquare,
  Brain,
  Layers,
  LogOut,
  Copy,
  Play,
  X,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

const AVATAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#22c55e",
  "#3b82f6", "#a855f7", "#ef4444", "#14b8a6",
];

const Whiteboard = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Room state
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [host, setHost] = useState(null);
  const isHost = host?.id === user?.id || host?._id === user?.id;

  // Canvas state
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [penType, setPenType] = useState("ballpoint");
  const [drawingLayer, setDrawingLayer] = useState([]);
  const [textLayer, setTextLayer] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Replay state
  const [replayMode, setReplayMode] = useState(false);
  const [eventLog, setEventLog] = useState([]);

  // ─── New Feature State ─────────────────────────
  const [stickyNotes, setStickyNotes] = useState([]);
  const [fileLayer, setFileLayer] = useState([]);
  const [laserPointers, setLaserPointers] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);

  // ─── Zoom & Pan State ────────────────────────
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // ─── Notebook Page State ─────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ─── Lasso Selection State ───────────────────
  const [selectedIds, setSelectedIds] = useState([]);

  const socketRef = useRef(null);

  // ─── Socket Setup ──────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.emit("room:join", { roomId });

    // Room data loaded
    socket.on("room:data", (data) => {
      setRoomData(data);
      setDrawingLayer(data.layers?.drawingLayer || []);
      setTextLayer(data.layers?.textLayer || []);
      setFileLayer(data.layers?.fileLayer || []);
      setChatMessages(data.chatHistory || []);
      setEventLog(data.eventLog || []);
      setHost(data.host);
      // Load sticky notes from textLayer
      const stickies = (data.layers?.textLayer || []).filter(el => el.type === "sticky");
      setStickyNotes(stickies);
    });

    // Participants
    socket.on("user:join", ({ participants: p }) => {
      setParticipants(p);
    });

    socket.on("user:leave", ({ participants: p }) => {
      setParticipants(p);
    });

    // Drawing from others
    socket.on("drawing:start", (stroke) => {
      // handled in Canvas component
    });

    socket.on("drawing:end", (stroke) => {
      setDrawingLayer((prev) => [...prev, stroke]);
      setEventLog((prev) => [
        ...prev,
        { eventType: "drawing:end", payload: stroke, timestamp: new Date() },
      ]);
    });

    socket.on("history:undo", ({ strokeId }) => {
      setDrawingLayer((prev) => prev.filter((s) => s.id !== strokeId));
    });

    socket.on("history:redo", (stroke) => {
      setDrawingLayer((prev) => [...prev, stroke]);
    });

    socket.on("board:clear", () => {
      setDrawingLayer([]);
      setTextLayer([]);
    });

    // Chat
    socket.on("chat:receive", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on("user:typing", ({ user: typingUser, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.find((u) => u.id === typingUser.id)
            ? prev
            : [...prev, typingUser];
        }
        return prev.filter((u) => u.id !== typingUser.id);
      });
    });

    // AI
    socket.on("ai:generate", (data) => {
      if (data.elements) {
        setTextLayer((prev) => [...prev, ...data.elements]);
      }
    });

    // ─── Sticky Note Events ────────────────────
    socket.on("sticky:create", (note) => {
      setStickyNotes((prev) => [...prev, note]);
    });

    socket.on("sticky:move", ({ id, x, y }) => {
      setStickyNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y } : n))
      );
    });

    socket.on("sticky:edit", ({ id, text }) => {
      setStickyNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, text } : n))
      );
    });

    socket.on("sticky:delete", ({ id }) => {
      setStickyNotes((prev) => prev.filter((n) => n.id !== id));
    });

    // ─── Image Events ──────────────────────────
    socket.on("image:add", (imageData) => {
      setFileLayer((prev) => [...prev, imageData]);
    });

    // ─── Laser Pointer Events ──────────────────
    socket.on("laser:move", ({ userId, username, point }) => {
      setLaserPointers((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          username,
          points: [...(prev[userId]?.points || []).slice(-30), point],
        },
      }));
    });

    socket.on("laser:stop", ({ userId }) => {
      setLaserPointers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.emit("room:leave");
      socket.off("room:data");
      socket.off("user:join");
      socket.off("user:leave");
      socket.off("drawing:start");
      socket.off("drawing:end");
      socket.off("history:undo");
      socket.off("history:redo");
      socket.off("board:clear");
      socket.off("chat:receive");
      socket.off("user:typing");
      socket.off("ai:generate");
      socket.off("sticky:create");
      socket.off("sticky:move");
      socket.off("sticky:edit");
      socket.off("sticky:delete");
      socket.off("image:add");
      socket.off("laser:move");
      socket.off("laser:stop");
      disconnectSocket();
    };
  }, [roomId]);

  // ─── Canvas Handlers ──────────────────────────
  const handleStrokeEnd = useCallback(
    (stroke) => {
      setDrawingLayer((prev) => [...prev, stroke]);
      setUndoStack([]);
      const socket = getSocket();
      if (socket) {
        socket.emit("drawing:end", stroke);
      }
      setEventLog((prev) => [
        ...prev,
        { eventType: "drawing:end", payload: stroke, timestamp: new Date() },
      ]);
    },
    []
  );

  const handleUndo = useCallback(() => {
    setDrawingLayer((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setUndoStack((stack) => [...stack, last]);
      const socket = getSocket();
      if (socket) socket.emit("history:undo", { strokeId: last.id });
      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1];
      setDrawingLayer((prev) => [...prev, last]);
      const socket = getSocket();
      if (socket) socket.emit("history:redo", last);
      return stack.slice(0, -1);
    });
  }, []);

  const handleClear = useCallback(() => {
    if (!isHost) return;
    const socket = getSocket();
    if (socket) socket.emit("board:clear", { roomId });
  }, [isHost, roomId]);

  // ─── Chat Handlers ────────────────────────────
  const handleSendMessage = useCallback(
    (message) => {
      const socket = getSocket();
      if (socket && message.trim()) {
        socket.emit("chat:send", { message });
      }
    },
    []
  );

  const handleTyping = useCallback((isTyping) => {
    const socket = getSocket();
    if (socket) socket.emit("user:typing", { isTyping });
  }, []);

  // ─── AI Handlers ──────────────────────────────
  const handleAIGenerate = useCallback(
    (elements) => {
      setTextLayer((prev) => [...prev, ...elements]);
      const socket = getSocket();
      if (socket) socket.emit("ai:generate", { elements });
    },
    []
  );

  // ─── Sticky Note Handlers ────────────────────
  const handleAddSticky = useCallback(() => {
    const note = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: "sticky",
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      width: 180,
      height: 120,
      text: "",
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      userId: user?.id,
      username: user?.name || "Unknown",
      timestamp: Date.now(),
    };
    setStickyNotes((prev) => [...prev, note]);
    const socket = getSocket();
    if (socket) socket.emit("sticky:create", note);
  }, [user]);

  const handleStickyMove = useCallback((id, pos) => {
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x: pos.x, y: pos.y } : n))
    );
    const socket = getSocket();
    if (socket) socket.emit("sticky:move", { id, x: pos.x, y: pos.y });
  }, []);

  const handleStickyEdit = useCallback((id, text) => {
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text } : n))
    );
    const socket = getSocket();
    if (socket) socket.emit("sticky:edit", { id, text });
  }, []);

  const handleStickyDelete = useCallback((id) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
    const socket = getSocket();
    if (socket) socket.emit("sticky:delete", { id });
  }, []);

  // ─── Image Upload Handler ────────────────────
  const handleImageUpload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("roomId", roomId);
    try {
      const res = await api.post("/rooms/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageData = res.data.image;
      setFileLayer((prev) => [...prev, imageData]);
      const socket = getSocket();
      if (socket) socket.emit("image:add", imageData);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Max 5MB allowed.");
    }
  }, [roomId]);

  // ─── Export Handler ──────────────────────────
  const handleExport = useCallback(async (format) => {
    const canvas = document.getElementById("whiteboard-canvas");
    if (!canvas) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = "#0f0f14";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    if (format === "png") {
      const link = document.createElement("a");
      link.download = `collabboard-${roomId}-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      link.click();
    } else if (format === "pdf") {
      try {
        const { default: jsPDF } = await import("jspdf");
        const imgData = tempCanvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? "landscape" : "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`collabboard-${roomId}-${Date.now()}.pdf`);
      } catch (err) {
        console.error("PDF export failed:", err);
        alert("PDF export requires jspdf. Installing...");
      }
    }
  }, [roomId]);

  // ─── Template Handler ────────────────────────
  const handleTemplateSelect = useCallback((elements) => {
    setTextLayer((prev) => [...prev, ...elements]);
    const socket = getSocket();
    if (socket) socket.emit("ai:generate", { elements });
  }, []);

  // ─── AI Handwriting-to-Text ──────────────────
  const handleHandwritingRecognize = useCallback(async () => {
    const canvas = document.getElementById("whiteboard-canvas");
    if (!canvas) return;

    const imageData = canvas.toDataURL("image/png");
    try {
      const res = await api.post("/ai/handwriting", { image: imageData });
      if (res.data.text) {
        // Create a text box with the recognized text
        const textElement = {
          id: `hw-${Date.now()}`,
          type: "box",
          x: 100,
          y: 100,
          width: Math.min(400, res.data.text.length * 9),
          height: 60,
          text: res.data.text,
        };
        setTextLayer((prev) => [...prev, textElement]);
        const socket = getSocket();
        if (socket) socket.emit("ai:generate", { elements: [textElement] });
      }
    } catch (err) {
      console.error("Handwriting recognition failed:", err);
      alert("Handwriting recognition failed. Make sure OpenAI API key is set.");
    }
  }, []);

  // ─── Zoom Handlers ──────────────────────────
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(5, z + 0.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.1, z - 0.2));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // ─── Page Handlers ────────────────────────────
  const handlePageUp = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const handlePageDown = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const handleAddPage = useCallback(() => {
    setTotalPages((t) => t + 1);
    setCurrentPage((t) => t);
  }, []);

  // ─── Lasso / Selection Handlers ──────────────
  const handleLassoSelect = useCallback((ids) => {
    setSelectedIds(ids);
  }, []);

  const handleDeleteStrokes = useCallback((ids) => {
    setDrawingLayer((prev) => prev.filter((s) => !ids.includes(s.id)));
    setSelectedIds([]);
    // Remove from remote
    const socket = getSocket();
    ids.forEach((id) => { if (socket) socket.emit("history:undo", { strokeId: id }); });
  }, []);

  const handleMoveStrokes = useCallback((ids, dx, dy) => {
    setDrawingLayer((prev) =>
      prev.map((s) =>
        ids.includes(s.id)
          ? { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
          : s
      )
    );
  }, []);

  // ─── Eraser: stroke-removal ──────────────────
  const handleEraseStroke = useCallback((strokeId) => {
    setDrawingLayer((prev) => prev.filter((s) => s.id !== strokeId));
    const socket = getSocket();
    if (socket) socket.emit("history:undo", { strokeId });
  }, []);

  // ─── Text Tool ───────────────────────────────
  const handleTextAdd = useCallback((textEl) => {
    setTextLayer((prev) => [...prev, textEl]);
    const socket = getSocket();
    if (socket) socket.emit("ai:generate", { elements: [textEl] });
  }, []);

  // ─── Template / text-layer element updates (drag) ─
  const handleTextLayerUpdate = useCallback((id, updates) => {
    setTextLayer((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        const updated = { ...el, ...updates };
        return updated;
      })
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length > 0) handleDeleteStrokes(selectedIds);
  }, [selectedIds, handleDeleteStrokes]);

  const handleLeave = () => {
    navigate("/dashboard");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
  };

  // ─── Keyboard Shortcuts ──────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      if (e.key === "p" || e.key === "P") { e.preventDefault(); setTool("pencil"); }
      if (e.key === "h" || e.key === "H") { e.preventDefault(); setTool("highlighter"); }
      if (e.key === "e" || e.key === "E") { e.preventDefault(); setTool("eraser"); }
      if (e.key === "t" || e.key === "T") { e.preventDefault(); setTool("text"); }
      if (e.key === "l" || e.key === "L") { e.preventDefault(); setTool("lasso"); }
      if (e.key === " ") { e.preventDefault(); setTool("pan"); }
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); handleRedo(); }
      if (e.key === "=" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleZoomIn(); }
      if (e.key === "-" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleZoomOut(); }
      if (e.key === "0" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleZoomReset(); }
    };
    const handleKeyUp = (e) => {
      if (e.key === " ") setTool("pencil");
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [handleUndo, handleRedo, handleZoomIn, handleZoomOut, handleZoomReset]);

  return (
    <div className="whiteboard-container">
      {/* ─── Top Bar ─────────────────── */}
      <div className="whiteboard-topbar">
        <div className="topbar-left">
          <span className="room-label" title="Click to copy" onClick={copyRoomId} style={{ cursor: "pointer" }}>
            #{roomId}
            <Copy size={12} style={{ marginLeft: 6, opacity: 0.6 }} />
          </span>
        </div>

        <div className="topbar-center">
          <div className="participants-bar">
            {participants.map((p, i) => (
              <div
                key={p.id || i}
                className="avatar"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                title={p.name}
              >
                {p.name?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="online-count">
            {participants.length} online
          </span>
        </div>

        <div className="topbar-right">
          <button
            className="btn btn-icon"
            onClick={() => setShowTemplates(true)}
            title="Template Library"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className="btn btn-icon"
            onClick={handleHandwritingRecognize}
            title="AI Handwriting-to-Text"
          >
            <Sparkles size={18} />
          </button>
          <button
            className={`btn btn-icon ${replayMode ? "active" : ""}`}
            onClick={() => setReplayMode(!replayMode)}
            title="Session Replay"
          >
            {replayMode ? <X size={18} /> : <Play size={18} />}
          </button>
          <button
            className="btn btn-icon"
            onClick={() => {
              setSidebarTab("ai");
              setSidebarOpen(true);
            }}
            title="AI Assistant"
          >
            <Brain size={18} />
          </button>
          <button
            className="btn btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Sidebar"
          >
            <MessageSquare size={18} />
          </button>
          <button className="btn btn-danger" onClick={handleLeave} style={{ padding: "8px 14px", fontSize: 13 }}>
            <LogOut size={16} />
            Leave
          </button>
        </div>
      </div>

      {/* ─── Main Area ───────────────── */}
      <div className="whiteboard-main">
        {/* Floating Toolbar */}
        {!replayMode && (
          <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            penType={penType}
            setPenType={setPenType}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onAddSticky={handleAddSticky}
            onImageUpload={handleImageUpload}
            onExport={handleExport}
            isHost={isHost}
            undoDisabled={drawingLayer.length === 0}
            redoDisabled={undoStack.length === 0}
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageUp={handlePageUp}
            onPageDown={handlePageDown}
            onAddPage={handleAddPage}
            selectedCount={selectedIds.length}
            onDeleteSelected={handleDeleteSelected}
          />
        )}

        {/* Canvas */}
        <div className="canvas-area">
          <Canvas
            tool={replayMode ? null : tool}
            color={color}
            brushSize={brushSize}
            penType={penType}
            drawingLayer={drawingLayer}
            textLayer={textLayer}
            fileLayer={fileLayer}
            stickyNotes={stickyNotes}
            laserPointers={laserPointers}
            onStrokeEnd={handleStrokeEnd}
            onEraseStroke={handleEraseStroke}
            onTextAdd={handleTextAdd}
            onTextLayerUpdate={handleTextLayerUpdate}
            onDeleteStrokes={handleDeleteStrokes}
            onMoveStrokes={handleMoveStrokes}
            socket={socketRef.current}
            disabled={replayMode}
            pages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            zoom={zoom}
            panOffset={panOffset}
            onZoomChange={setZoom}
            onPanChange={setPanOffset}
            onLassoSelect={handleLassoSelect}
          />
          {/* Sticky Notes Overlay */}
          {stickyNotes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              onMove={handleStickyMove}
              onEdit={handleStickyEdit}
              onDelete={handleStickyDelete}
              isOwner={note.userId === user?.id || isHost}
            />
          ))}
        </div>

        {/* Right Sidebar */}
        <div className={`sidebar-right ${sidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${sidebarTab === "chat" ? "active" : ""}`}
              onClick={() => setSidebarTab("chat")}
            >
              <MessageSquare size={14} style={{ marginRight: 6 }} />
              Chat
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === "ai" ? "active" : ""}`}
              onClick={() => setSidebarTab("ai")}
            >
              <Brain size={14} style={{ marginRight: 6 }} />
              AI
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === "layers" ? "active" : ""}`}
              onClick={() => setSidebarTab("layers")}
            >
              <Layers size={14} style={{ marginRight: 6 }} />
              Layers
            </button>
          </div>

          <div className="sidebar-content">
            {sidebarTab === "chat" && (
              <ChatPanel
                messages={chatMessages}
                typingUsers={typingUsers}
                onSend={handleSendMessage}
                onTyping={handleTyping}
                currentUser={user}
              />
            )}
            {sidebarTab === "ai" && (
              <AIPanel
                chatHistory={chatMessages}
                eventLog={eventLog}
                onGenerate={handleAIGenerate}
              />
            )}
            {sidebarTab === "layers" && (
              <div>
                <h4 style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                  Drawing Layer
                </h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {drawingLayer.length} strokes
                </p>
                <h4 style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16, marginBottom: 12 }}>
                  Text / AI Layer
                </h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {textLayer.length} elements
                </p>
                <h4 style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16, marginBottom: 12 }}>
                  📌 Sticky Notes
                </h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {stickyNotes.length} notes
                </p>
                <h4 style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16, marginBottom: 12 }}>
                  🖼️ Images
                </h4>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {fileLayer.length} images
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Replay Timeline ─────────── */}
      {replayMode && (
        <ReplayBar
          eventLog={eventLog}
          drawingLayer={drawingLayer}
          setDrawingLayer={setDrawingLayer}
          setTextLayer={setTextLayer}
        />
      )}

      {/* ─── Template Library Modal ──── */}
      {showTemplates && (
        <TemplateLibrary
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default Whiteboard;
