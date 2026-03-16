import express from 'express';
import session from "express-session";
import crypto from "crypto";
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;
const secret = crypto.randomBytes(64).toString("hex");

// Initialize Database
const db = await open({
    filename: 'database.db',
    driver: sqlite3.Database
});

await db.exec(`CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    dateOfBirth TEXT NOT NULL,
    topScore INTEGER DEFAULT 0
)`);

// Middleware
function requireLogin(req, res, next) {
    if (!req.session.userId) return res.redirect("/login");
    next();
}

app.use(express.static(path.join(__dirname, "Styles")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax'
}));

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "Views", "registration.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "Views", "login.html")));
app.get("/game", requireLogin, (req, res) => res.sendFile(path.join(__dirname, "Views", "game.html")));

app.post("/register", async (req, res) => {
    try {
        const { username, password, dayOfMonth, firstPartMonth, firstNumberDate } = req.body;
        const dob = `${dayOfMonth}/${firstPartMonth}/${firstNumberDate}`; // Simplified for example
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run(`INSERT INTO Users (username, password, dateOfBirth) VALUES (?, ?, ?)`, [username, hashedPassword, dob]);
        res.redirect("/login");
    } catch (err) {
        res.status(500).send("Registration failed: Username might be taken.");
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get("SELECT * FROM Users WHERE username = ?", [username]);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = user.username;
        return res.redirect("/game");
    }
    res.status(401).send("Invalid credentials");
});

// New Functionality: Save Score
app.post("/save-score", requireLogin, async (req, res) => {
    const { wpm } = req.body;
    await db.run(`UPDATE Users SET topScore = MAX(topScore, ?) WHERE id = ?`, [wpm, req.session.userId]);
    res.json({ success: true });
});

// New Functionality: Get Leaderboard
app.get("/leaderboard", async (req, res) => {
    const topPlayers = await db.all("SELECT username, topScore FROM Users ORDER BY topScore DESC LIMIT 5");
    res.json(topPlayers);
});

app.listen(port, () => console.log("Server running at http://localhost:" + port));