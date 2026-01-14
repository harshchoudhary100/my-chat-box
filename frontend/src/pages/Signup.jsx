import { useState } from "react";
import { signup } from "../api";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Signup() {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await signup(data);
      alert("Signup successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>

      <input
        type="text"
        placeholder="Name"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
      />

      <input
        type="email"
        placeholder="Email"
        value={data.email}
        onChange={(e) => setData({ ...data, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        value={data.password}
        onChange={(e) => setData({ ...data, password: e.target.value })}
      />

      <button onClick={handleSubmit}>Sign Up</button>

      <p className="auth-link" onClick={() => navigate("/login")}>
        Already have an account? Login
      </p>
    </div>
  );
}
