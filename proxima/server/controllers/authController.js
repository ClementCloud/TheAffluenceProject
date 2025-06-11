import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db, { initializeDB } from "../db.js";
import { JWT_SECRET } from "../config.js";

initializeDB().catch(console.error);

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    // Check if user exists
    const exists = db.data.users.find(u => u.email === email);
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = { 
      id: Date.now().toString(), 
      email, 
      password: hash,
      name: "",
      age: null,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(user);
    await db.write();

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: "Email and password required" });
    }

    // Debug: Log all users in the database
    console.log('All users in database:', db.data.users.map(u => ({ email: u.email, id: u.id })));

    const user = db.data.users.find(u => u.email === email);
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ error: "Invalid credentials" });
    }

    console.log('User found, comparing passwords');
    const valid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', valid);

    if (!valid) {
      console.log('Invalid password');
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    console.log('Login successful, token generated');
    res.json({ user: { id: user.id, email: user.email }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
}; 