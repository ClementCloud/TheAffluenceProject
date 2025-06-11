import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        // Don't try to parse the token, just use it
        setToken(storedToken);
        fetchGoals(storedToken);
      } catch (err) {
        console.error("Error with token:", err);
        logout();
      }
    }
  }, []);

  const fetchGoals = async (authToken) => {
    if (!authToken) {
      console.error("No token provided to fetchGoals");
      return;
    }

    try {
      console.log("Fetching goals with token:", authToken.substring(0, 20) + "...");
      const response = await fetch("/api/goals", {
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Token invalid or expired");
          logout();
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Failed to fetch goals");
      }
      
      const userGoals = await response.json();
      setGoals(userGoals);
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError(err.message);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      
      // Fetch goals after successful login
      await fetchGoals(data.token);
    } catch (err) {
      setError(err.message);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      
      // Fetch goals after successful registration
      await fetchGoals(data.token);
    } catch (err) {
      setError(err.message);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setGoals([]);
    localStorage.removeItem("token");
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        token, 
        loading, 
        error, 
        login, 
        register, 
        logout, 
        goals, 
        setGoals,
        fetchGoals 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}; 