import axios from "axios";

const API = "http://localhost:5000";

axios.defaults.withCredentials = true;
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userId");
      } catch (e) {
        console.error(e);
      }
      try {
        window.location.assign("/login");
      } catch (e) {
        console.error(e);
      }
    }
    return Promise.reject(err);
  }
);

export const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

// AUTH
export const signup = (data) => axios.post(`${API}/auth/signup`, data);
export const login = (data) => axios.post(`${API}/auth/login`, data);
export const logout = async (token) => {
  const res = await axios.post(
    `${API}/auth/logout`,
    {},
    { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
  );
  return res.data;
};

// Sessions
export const fetchSessions = async (token) => {
  const res = await axios.get(`${API}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createSession = async (token) => {
  const res = await axios.post(
    `${API}/session/create`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data.sessionId;
};

export const deleteSession = async (sessionId, token) => {
  const res = await axios.delete(`${API}/session/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const renameSession = async (sessionId, newTitle, token) => {
  const res = await axios.put(
    `${API}/session/rename/${sessionId}`,
    { newTitle },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
};


// Chat
export const fetchHistory = async (sessionId, token) => {
  const res = await axios.get(`${API}/history/${sessionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendMessageAPI = async (sessionId, message, token) => {
  const res = await axios.post(
    `${API}/chat/${sessionId}`,
    { message },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data.reply;
};
