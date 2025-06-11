import React, { useEffect, useState } from "react";

const Welcome = ({ user }) => {
  const [visible, setVisible] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Fetch latest profile to pick up a freshly-entered name
  useEffect(() => {
    if (!user?.id) return;

    const abort = new AbortController();
    fetch("/api/users/me", {
      signal: abort.signal,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setProfileName(data.name);
      })
      .catch(() => {});

    return () => abort.abort();
  }, [user?.id]);

  const displayName = profileName || (user?.email ? user.email.split("@")[0] : "there");

  return (
    <div className="flex items-center justify-center h-full w-full">
      <h1
        className={`text-4xl md:text-6xl font-extrabold text-primary transition-all duration-700 transform ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      >
        Welcome to Proxima {displayName}
      </h1>
    </div>
  );
};

export default Welcome; 