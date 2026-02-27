import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

const ChatPanel = ({ messages, typingUsers, onSend, onTyping, currentUser }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Typing indicator
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="chat-msg">
            <div className="msg-header">
              <span className="msg-user">{msg.username}</span>
              <span className="msg-time">{formatTime(msg.timestamp)}</span>
            </div>
            <div className="msg-text">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="typing-indicator">
        {typingUsers.length > 0 &&
          `${typingUsers.map((u) => u.name).join(", ")} typing...`}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <button className="btn btn-icon" onClick={handleSend}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
