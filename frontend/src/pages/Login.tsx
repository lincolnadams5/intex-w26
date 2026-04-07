import { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ If already logged in
  if (localStorage.getItem("token")) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>You are already logged in</h2>
          <button
            className="login-button"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("https://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      let data;

      // ✅ Handle both JSON and text responses safely
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }

      if (res.ok) {
        // ✅ Save token
        localStorage.setItem("token", data.token);

        // ✅ Save user (optional)
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // 🔐 OPTIONAL: test secured endpoint (great for demo)
        const token = data.token;

        const testRes = await fetch("https://localhost:5001/api/auth/secure", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log("Secure endpoint test:", await testRes.text());

        // ✅ Redirect after login
        window.location.href = "/dashboard";

      } else {
        setError(data?.message || data || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}