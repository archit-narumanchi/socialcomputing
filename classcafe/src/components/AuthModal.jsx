"use client";

import { useState } from "react";
import styles from "./AuthModal.module.css";

const API_BASE_URL = "https://classcafe-backend.onrender.com/api";

const decodeTokenPayload = (token) => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    return JSON.parse(atob(payload));
  } catch (error) {
    console.warn("Failed to decode token payload", error);
    return null;
  }
};

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin
        ? { email, password }
        : { email, username, password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // If not JSON, try to get text for error message
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);

        const payload = decodeTokenPayload(data.token);
        if (payload?.userId) {
          localStorage.setItem("userId", String(payload.userId));
        }
        if (payload?.email) {
          localStorage.setItem("userEmail", payload.email);
        }

        onLoginSuccess();
        onClose();
        // Reset form
        setEmail("");
        setUsername("");
        setPassword("");
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      // Handle JSON parsing errors specifically
      if (err instanceof SyntaxError) {
        setError("Invalid response from server. Please check the API endpoint.");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.title}>
          {isLogin ? "Login" : "Register"}
        </h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
                disabled={isLoading}
                placeholder="Enter your username"
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : isLogin
              ? "Login"
              : "Register"}
          </button>
        </form>
        <div className={styles.switchMode}>
          <span>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={switchMode}
            className={styles.switchButton}
            disabled={isLoading}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

