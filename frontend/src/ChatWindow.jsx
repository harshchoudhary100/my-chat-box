import { useEffect, useRef, useState } from "react";
import { fetchHistory, sendMessageAPI, getToken } from "./api";
import "./ChatWindow.css";

export default function ChatWindow({ sessionId }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const token = getToken();

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Load chat history
  useEffect(() => {
    const loadHistory = async () => {
      const data = await fetchHistory(sessionId, token);
      const msgs = Array.isArray(data) ? data : [];

      const formatted = msgs.map((m) => ({
        sender: m.role === "human" ? "user" : "bot",
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setChat(formatted);
    };

    loadHistory();
  }, [sessionId]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const msg = message;
    setMessage("");

    setChat((prev) => [...prev, { sender: "user", text: msg }]);
    setLoading(true);

    const reply = await sendMessageAPI(sessionId, msg, token);

    setChat((prev) => [...prev, { sender: "bot", text: reply }]);
    setLoading(false);
  };

  return (
    <div className="chat-window">
      <div className="chat-box">
        {chat.map((c, i) => (
          <div key={i} className={`row ${c.sender}`}>
            <div className="bubble">{c.text}</div>
          </div>
        ))}

        {loading && (
          <div className="row bot">
            <div className="bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={endRef}></div>
      </div>

      <div className="chat-input-bar">
        <textarea
          value={message}
          className="chat-textarea"
          placeholder="Type message..."
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey ? sendMessage() : null
          }
        />

        <button className="send-btn" onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}
