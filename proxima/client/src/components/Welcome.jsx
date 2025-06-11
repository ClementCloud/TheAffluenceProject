import React, { useEffect, useState } from "react";

const Welcome = ({ user }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // small delay to allow transition to play after mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "there");

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