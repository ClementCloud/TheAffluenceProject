import React, { useState } from "react";
import { createPortal } from "react-dom";

const NameAgePrompt = ({ onSave }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim() || !age) {
      setError("Please enter both name and age");
      return;
    }
    onSave({ name: name.trim(), age: Number(age) });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-6 text-center">
        <h2 className="text-xl font-bold mb-4 text-primary">Tell us about you</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-primary"
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-primary"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={handleSave}
            className="w-full py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NameAgePrompt; 