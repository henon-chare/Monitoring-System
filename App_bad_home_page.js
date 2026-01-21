import React, { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("login"); // login, register, forgot, reset, home
  const [formData, setFormData] = useState({ username: "", email: "", password: "", token: "" });
  const [message, setMessage] = useState("");
  const [userLoggedIn, setUserLoggedIn] = useState(false); // track login

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
        if (page === "login") setUserLoggedIn(true); // redirect after login
      } else {
        setMessage(data.detail || "Error occurred");
      }
    } catch (err) {
      setMessage("Server not reachable");
    }
  };

  // ------------------ Home Page ------------------
  const HomePage = () => {
    return (
      <div className="home-container">
        <h1>Welcome to CyberGuard Dashboard</h1>
        <p>Monitor websites, track domains, detect threats, and receive alerts all in one place!</p>

        <div className="features">
          <div className="feature-card">
            <h2>Website Monitoring</h2>
            <p>Keep track of uptime, performance, and anomalies of your websites.</p>
          </div>
          <div className="feature-card">
            <h2>Domain Tracking</h2>
            <p>Monitor domain status, expiration, and potential risks.</p>
          </div>
          <div className="feature-card">
            <h2>Threat Detection</h2>
            <p>Detect vulnerabilities and suspicious activities in real-time.</p>
          </div>
          <div className="feature-card">
            <h2>Alert Dashboard</h2>
            <p>Receive instant alerts and notifications for critical events.</p>
          </div>
        </div>

        <button onClick={() => { setUserLoggedIn(false); setPage("login"); }}>Logout</button>
      </div>
    );
  };

  // ------------------ Render ------------------
  if (userLoggedIn) return <HomePage />;

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
