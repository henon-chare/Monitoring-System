// App.js
import React, { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("login"); // login, register, forgot
  const [formData, setFormData] = useState({ username: "", email: "", password: "", token: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = "";
    let body = {};

    if (page === "login") {
      url = "http://localhost:8000/login";
      body = { username: formData.username, password: formData.password };
    } else if (page === "register") {
      url = "http://localhost:8000/register";
      body = { username: formData.username, email: formData.email, password: formData.password };
    } else if (page === "forgot") {
      url = "http://localhost:8000/forgot-password";
      body = { email: formData.email };
    } else if (page === "reset") {
      url = "http://localhost:8000/reset-password";
      body = { token: formData.token, new_password: formData.password };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.detail || "Error occurred");
      }
    } catch (err) {
      setMessage("Server not reachable");
    }
  };

  return (
    <div className="container">
      <h1>CyberGuard</h1>

      {message && <div className="message">{message}</div>}

      <form onSubmit={handleSubmit} className="form">
        {(page === "register" || page === "login") && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        )}

        {(page === "register" || page === "forgot") && (
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        )}

        {(page === "login" || page === "register" || page === "reset") && (
          <input
            type="password"
            name="password"
            placeholder={page === "reset" ? "New Password" : "Password"}
            value={formData.password}
            onChange={handleChange}
            required
          />
        )}

        {page === "reset" && (
          <input
            type="text"
            name="token"
            placeholder="Reset Token"
            value={formData.token}
            onChange={handleChange}
            required
          />
        )}

        <button type="submit">
          {page === "login" && "Login"}
          {page === "register" && "Register"}
          {page === "forgot" && "Send Reset Email"}
          {page === "reset" && "Reset Password"}
        </button>
      </form>

      <div className="links">
        {page !== "login" && <p onClick={() => { setPage("login"); setMessage(""); }}>Login</p>}
        {page !== "register" && <p onClick={() => { setPage("register"); setMessage(""); }}>Register</p>}
        {page !== "forgot" && <p onClick={() => { setPage("forgot"); setMessage(""); }}>Forgot Password</p>}
        {page !== "reset" && page === "forgot" && <p onClick={() => { setPage("reset"); setMessage(""); }}>Reset Password</p>}
      </div>
    </div>
  );
}

export default App;
