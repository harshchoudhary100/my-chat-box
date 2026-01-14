import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { fetchSessions, deleteSession, createSession, renameSession, getToken, logout as logoutAPI } from "./api";
import "./Home.css";

export default function Home() {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [dark, setDark] = useState(false);

  const token = getToken();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    dark
      ? document.body.classList.add("dark")
      : document.body.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const load = async () => {
      const sess = await fetchSessions(token);
      setSessions(sess);

      if (!activeSession) {
        if (sess.length > 0) {
          setActiveSession(sess[0].sessionId || sess[0]._id);
        } else {
          const id = await createSession(token);
          setActiveSession(id);
        }
      }
    };

    load();
  }, [token]);

  return (
    <div className="layout">

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={setActiveSession}
        onNewChat={async () => {
          const id = await createSession(token);
          setActiveSession(id);
        }}
        onDeleteSession={async (id) => {
          await deleteSession(id, token);
          const sess = await fetchSessions(token);
          setSessions(sess);
          if (sess.length) setActiveSession(sess[0].sessionId);
        }}
        onRenameSession={async (sessionId, newTitle, done) => {
          try {
            await renameSession(sessionId, newTitle, token);
            const sess = await fetchSessions(token);
            setSessions(sess);
            typeof done === "function" && done(null);
          } catch (err) {
            console.error(err);
          }
        }}
        loggingOut={loggingOut}
        logoutError={logoutError}
        onLogout={async () => {
          if (loggingOut) return;
          setLogoutError("");
          setLoggingOut(true);
          try {
            await logoutAPI(token);
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("userId");
            setSessions([]);
            setActiveSession(null);
            navigate("/login");
          } catch (err) {
            setLogoutError(err.response?.data?.error || "Logout failed");
          } finally {
            setLoggingOut(false);
          }
        }}
        onToggleTheme={() => setDark(!dark)}
      />

      {/* Chat Window */}
      <div className="chat-area">
        {activeSession ? (
          <ChatWindow sessionId={activeSession} />
        ) : (
          <div className="empty">Select a chat or create a new one...</div>
        )}
      </div>

    </div>
  );
}
