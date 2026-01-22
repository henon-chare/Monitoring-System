import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", token: "" });
  const [message, setMessage] = useState("");
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

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
        if (page === "login") {
          setUserLoggedIn(true);
          setSelectedCard(null);
        }
      } else {
        setMessage(data.detail || "Error occurred");
      }
    } catch (err) {
      setMessage("Server not reachable");
    }
  };

  // ------------------ Home Page (Dashboard) ------------------
  const HomePage = () => {
    if (selectedCard === "monitoring") {
      return <MonitoringComponent onBack={() => setSelectedCard(null)} />;
    }

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>CyberGuard</h1>
          <button
            className="logout-btn"
            onClick={() => {
              setUserLoggedIn(false);
              setPage("login");
            }}
          >
            Logout
          </button>
        </header>
        <section className="hero">
          <h2>Security Operations Center</h2>
          <p>Monitor • Detect • Protect • Respond</p>
        </section>
        <section className="cards">
          <div className="card" onClick={() => setSelectedCard("monitoring")}>
            <span className="icon">🌐</span>
            <h3>Website Monitoring</h3>
            <p>Track uptime, response time, and anomalies in real time.</p>
          </div>
          <div className="card">
            <span className="icon">🔍</span>
            <h3>Domain Tracking</h3>
            <p>Monitor domain status, DNS changes, and expiration risks.</p>
          </div>
          <div className="card">
            <span className="icon">🛡️</span>
            <h3>Threat Detection</h3>
            <p>Identify vulnerabilities and suspicious activities.</p>
          </div>
          <div className="card">
            <span className="icon">🚨</span>
            <h3>Alert Dashboard</h3>
            <p>Instant alerts for critical security events.</p>
          </div>
        </section>
      </div>
    );
  };

  // ------------------ Monitoring Component ------------------
  const MonitoringComponent = ({ onBack }) => {
    const [url, setUrl] = useState("https://google.com");
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [data, setData] = useState({
      targets: [],
      current_latencies: {},
      baseline_avgs: {},
      status_messages: {},
      histories: {},
      timestamps: {}
    });

    useEffect(() => {
      let interval;
      if (isMonitoring) {
        interval = setInterval(async () => {
          try {
            const response = await fetch("http://localhost:8000/status");
            const jsonData = await response.json();
            setData(jsonData);
          } catch (error) {
            console.error("Backend connection lost", error);
          }
        }, 1000);
      }
      return () => clearInterval(interval);
    }, [isMonitoring]);

    const handleStart = async () => {
      if (!url || !url.startsWith('http')) {
        alert("Please enter a valid URL starting with http/https");
        return;
      }

      const payload = { url: url.trim() };
      console.log("[START] Sending payload →", payload);
      console.log("[START] Full request URL → http://localhost:8000/start");

      try {
        const response = await fetch("http://localhost:8000/start", {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("[START] Response status:", response.status);

        if (!response.ok) {
          let errorBody;
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { detail: await response.text() || "No details" };
          }
          console.error("[START] Error response body:", errorBody);
          throw new Error(
            `Backend rejected request (${response.status}): ${errorBody.detail || "Validation error"}`
          );
        }

        const data = await response.json();
        console.log("[START] Success:", data);
        setIsMonitoring(true);
      } catch (err) {
        console.error("[START] Full error:", err);
        alert("Start failed:\n" + (err.message || "Unknown error - check browser console"));
      }
    };

    const handleStop = async () => {
      try {
        const res = await fetch("http://localhost:8000/stop", { method: "POST" });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || "Failed to stop");
        }
        setIsMonitoring(false);
      } catch (error) {
        console.error("Stop error:", error);
        alert("Failed to stop: " + error.message);
      }
    };

    // Chart component remains the same
    const RealTimeChart = ({ history }) => {
      const canvasRef = React.useRef(null);

      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        if (history.length < 2) return;

        const maxVal = Math.max(...history, 100) * 1.2;
        const stepX = width / 50;

        // Baseline
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        const avgY = height - (avg / maxVal * height);
        ctx.beginPath();
        ctx.strokeStyle = '#444';
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, avgY);
        ctx.lineTo(width, avgY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Line
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        history.forEach((val, i) => {
          const x = i * stepX;
          const y = height - (val / maxVal * height);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill
        ctx.lineTo((history.length - 1) * stepX, height);
        ctx.lineTo(0, height);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fill();
      }, [history]);

      return (
        <canvas
          ref={canvasRef}
          width={1000}
          height={500}
          style={{ width: '100%', height: '100%' }}
        />
      );
    };

    return (
      <div className="app-container">
        <button className="btn btn-back" onClick={onBack}>Back to Dashboard</button>

        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>ServerPulse</h2>
            <div className={`status-indicator ${isMonitoring ? 'active' : 'idle'}`}>
              {isMonitoring ? '● LIVE' : '○ IDLE'}
            </div>
          </div>

          <div className="control-section">
            <label>Target URL</label>
            <div className="input-group">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isMonitoring}
                placeholder="https://example.com"
              />
              {!isMonitoring ? (
                <button className="btn btn-primary" onClick={handleStart}>START</button>
              ) : (
                <button className="btn btn-danger" onClick={handleStop}>STOP</button>
              )}
            </div>
          </div>

          <div className="results-summary">
            <h3>Live Results</h3>
            {data.targets.map((target) => (
              <div key={target}>
                <h4>{target}</h4>
                <div className="stat-card">
                  <span className="label">Current Latency</span>
                  <span className="value">{(data.current_latencies[target] || 0).toFixed(0)} <small>ms</small></span>
                </div>
                <div className="stat-card">
                  <span className="label">Baseline (Avg)</span>
                  <span className="value">{(data.baseline_avgs[target] || 0).toFixed(0)} <small>ms</small></span>
                </div>
                <div className="stat-card">
                  <span className="label">Status</span>
                  <span className={`value ${data.status_messages[target]?.includes('CRITICAL') ? 'text-danger' : 'text-success'}`}>
                    {data.status_messages[target] || "Idle"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="activity-log">
            <h3>Activity Log</h3>
            <div className="log-list">
              {data.targets.map((target) => (
                <div key={target}>
                  <h4>{target}</h4>
                  {(data.timestamps[target] || []).map((ts, index) => {
                    const latency = data.histories[target]?.[index] || 0;
                    const date = new Date(ts * 1000);
                    const timeStr = date.toLocaleTimeString();
                    const isAnomaly = Math.abs(latency - (data.baseline_avgs[target] || 0)) > (2 * (data.baseline_avgs[target] || 1));
                    return (
                      <div key={index} className="log-item">
                        <span className="log-time">{timeStr}</span>
                        <span className="log-latency">{latency.toFixed(0)}ms</span>
                        <span className={`log-status ${isAnomaly ? 'danger' : 'ok'}`}>
                          {isAnomaly ? 'WARN' : 'OK'}
                        </span>
                      </div>
                    );
                  }).reverse()}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header className="top-bar">
            <h3>Real-Time Performance Visualization</h3>
          </header>
          <div className="chart-wrapper">
            {data.targets.map((target) => (
              <div key={target}>
                <h4>{target}</h4>
                <RealTimeChart history={data.histories[target] || []} />
              </div>
            ))}
          </div>
          <div className="info-panel">
            <div className="info-box">
              <h4>System Information</h4>
              <p>Backend: FastAPI (Python)</p>
              <p>Frontend: React</p>
              <p>Sampling Rate: 1s</p>
            </div>
            <div className="info-box">
              <h4>Algorithm</h4>
              <p>Uses Moving Average and Standard Deviation (Z-Score) to dynamically detect anomalies in server response time.</p>
            </div>
          </div>
        </main>
      </div>
    );
  };

  if (userLoggedIn) return <HomePage />;
  return (
    <div className="app-auth">
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
    </div>
  );
}

export default App;