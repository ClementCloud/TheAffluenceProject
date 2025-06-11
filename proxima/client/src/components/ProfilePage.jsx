import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "./UserContext";

const ProfilePage = () => {
  const { user, token, logout } = useContext(UserContext);
  const [profile, setProfile] = useState({ name: "", age: "", email: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile({ name: data.name || "", age: data.age || "", email: data.email });
      } catch (error) {
        console.error(error);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const parseResponse = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return await res.json();
    }
    return { error: await res.text() };
  };

  const handleSave = async () => {
    setErr("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setMsg("Profile updated");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleChangePassword = async () => {
    setErr("");
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(passwords)
      });
      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data.error || "Password change failed");
      setMsg("Password updated");
      setPasswords({ currentPassword: "", newPassword: "" });
      localStorage.setItem("token", data.token);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-md rounded-xl p-8 space-y-6">
      <h1 className="text-2xl font-bold text-primary mb-4">Profile</h1>
      {err && <p className="text-sm text-red-500">{err}</p>}
      {msg && <p className="text-sm text-green-600">{msg}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input className="w-full border rounded-lg px-3 py-2" value={profile.name} onChange={(e)=>setProfile({...profile, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input type="number" className="w-full border rounded-lg px-3 py-2" value={profile.age} onChange={(e)=>setProfile({...profile, age: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="w-full border rounded-lg px-3 py-2" value={profile.email} onChange={(e)=>setProfile({...profile, email: e.target.value})} />
        </div>
        <button onClick={handleSave} className="w-full py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Save Profile</button>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <div className="space-y-4">
          <input type="password" placeholder="Current password" className="w-full border rounded-lg px-3 py-2" value={passwords.currentPassword} onChange={(e)=>setPasswords({...passwords, currentPassword: e.target.value})} />
          <input type="password" placeholder="New password" className="w-full border rounded-lg px-3 py-2" value={passwords.newPassword} onChange={(e)=>setPasswords({...passwords, newPassword: e.target.value})} />
          <button onClick={handleChangePassword} className="w-full py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90">Update Password</button>
        </div>
      </div>

      <button onClick={logout} className="text-sm text-red-500 underline mt-6">Logout</button>
    </div>
  );
};

export default ProfilePage; 