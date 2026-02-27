import { useState, useRef, useEffect } from "react";
import { GripVertical, X, Check } from "lucide-react";

const STICKY_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fecaca", // red
  "#e9d5ff", // purple
  "#fed7aa", // orange
];

const StickyNote = ({ note, onMove, onEdit, onDelete, isOwner }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const noteRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e) => {
    if (isEditing) return;
    e.stopPropagation();
    const rect = noteRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const parent = noteRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const x = e.clientX - parentRect.left - dragOffset.x;
      const y = e.clientY - parentRect.top - dragOffset.y;
      onMove(note.id, { x: Math.max(0, x), y: Math.max(0, y) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, onMove]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(note.text);
  };

  const handleSave = () => {
    onEdit(note.id, editText);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(note.text);
    }
  };

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${isDragging ? "dragging" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        backgroundColor: note.color || STICKY_COLORS[0],
        width: note.width || 180,
        minHeight: note.height || 120,
        zIndex: isDragging ? 1000 : 100,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Drag Handle */}
      <div className="sticky-header" onMouseDown={handleMouseDown}>
        <GripVertical size={14} className="sticky-grip" />
        <span className="sticky-author">{note.username || "Unknown"}</span>
        {isOwner && (
          <button
            className="sticky-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="sticky-body">
        {isEditing ? (
          <div className="sticky-edit-area">
            <textarea
              ref={textRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="sticky-textarea"
              placeholder="Type your note..."
            />
            <button className="sticky-save" onClick={handleSave}>
              <Check size={14} />
            </button>
          </div>
        ) : (
          <p className="sticky-text">{note.text || "Double-click to edit"}</p>
        )}
      </div>
    </div>
  );
};

export { STICKY_COLORS };
export default StickyNote;
