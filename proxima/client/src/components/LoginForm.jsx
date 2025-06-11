import React, { useState, useContext } from "react";
import { UserContext } from "./UserContext";

const LoginForm = () => {
  const { login, register, loading, error } = useContext(UserContext);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      login(email, password);
    } else {
      register(email, password);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-primary mb-2 text-center">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h2>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <input
          type="email"
          className="border rounded px-3 py-2 w-full"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="border rounded px-3 py-2 w-full"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-primary text-white rounded px-4 py-2 font-semibold mt-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (mode === "login" ? "Signing In..." : "Registering...") : (mode === "login" ? "Sign In" : "Register")}
        </button>
        <div className="text-center text-sm mt-2">
          {mode === "login" ? (
            <>
              Don't have an account?{' '}
              <button type="button" className="text-primary underline" onClick={() => setMode("register")}>Register</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" className="text-primary underline" onClick={() => setMode("login")}>Sign In</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginForm; 