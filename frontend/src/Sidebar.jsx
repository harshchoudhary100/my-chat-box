import { useState } from "react";
import "./Sidebar.css";

export default function Sidebar({
  sessions,
  activeSession,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onLogout,
  onToggleTheme,
}) {
  const [renameMode, setRenameMode] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="sidebar">
      <div className="top-buttons">
        <button className="new-chat-btn" onClick={onNewChat}>
          + New Chat
        </button>
        <button className="theme-btn" onClick={onToggleTheme}>
          🌓
        </button>
      </div>

      <div className="session-list">
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            className={`session-item ${
              activeSession === s.sessionId ? "active" : ""
            }`}
          >
            {renameMode === s.sessionId ? (
              <input
                className="rename-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  onRenameSession(s.sessionId, newTitle, setRenameMode)
                }
              />
            ) : (
              <span onClick={() => onSelectSession(s.sessionId)}>
                {s.title}
              </span>
            )}

            <div className="icons">
              <span
                className="icon"
                onClick={() => {
                  setRenameMode(s.sessionId);
                  setNewTitle(s.title);
                }}
              >
                ✎
              </span>

              <span
                className="icon"
                onClick={() => onDeleteSession(s.sessionId)}
              >
                🗑
              </span>
            </div>
          </div>
        ))}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
