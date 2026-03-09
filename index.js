import express from 'express'; //backend tool
import session from "express-session"; //cookies
import crypto from "crypto"; //random string for cookies
import path from 'path'; 
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3'; //SQLite database
import { open } from 'sqlite'; //SQLite database
import bcrypt from "bcrypt"; //hashing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;
const secret = crypto.randomBytes(64).toString("hex");
console.log(secret);

//Creating the database
const db = await open({
  filename: 'database.db',
  driver: sqlite3.Database
});

await db.exec(`CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  password TEXT NOT NULL,
  dateOfBirth TEXT NOT NULL
)`);

function requireLogin(req,res,next){
  if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();

}

app.use(express.static(path.join(__dirname, "Styles")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: secret, // use env var in production
  resave: false, // don’t save session if unmodified
  saveUninitialized: false, // don’t create session until something stored
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 // 1 day
    
  },
  secure: false,                // only HTTPS !!!!!!!!!!! change
  httpOnly: true,              // cannot be accessed by JS
  sameSite: 'lax'              // prevents CSRF in most cases
}));

app.get("/" , (req, res)=>{
    res.sendFile(path.join(__dirname, "Views", "registration.html"));
});

app.post("/register", async (req, res) => {
  console.log("REGISTER ROUTE HIT");

  try {
    const user = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    password: req.body.password,
    dateOfBirth:
      req.body.dayOfMonth + "/" +
      req.body.firstPartMonth +
      req.body.secondPartMonth +
      req.body.thirdPartMonth + "/" +
      req.body.firstNumberDate +
      req.body.secondNumberDate +
      req.body.thirdNumberDate +
      req.body.fourthNumberDate
  };

    console.log("First Name:", user.firstName);
    console.log("Last Name:", user.lastName);
    console.log("Username:", user.username);

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const result = await db.run(
      `INSERT INTO Users
       (username, firstName, lastName, password, dateOfBirth)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.username,
        user.firstName,
        user.lastName,
        hashedPassword,
        user.dateOfBirth
      ]
    );

    console.log("DB result:", result);

    res.redirect("/login");

  } catch (err) {
    console.error("Database insert failed:", err);
    res.status(500).send("Something went wrong");
  }
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "Views", "login.html"));
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.get(
      "SELECT * FROM Users WHERE username = ?",
      [username]
    );

    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).send("Invalid username or password");
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    console.log("Session created:", req.session);

    res.redirect("/game"); // redirect to protected page
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

app.get("/game", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "Views", "game.html"));
});

app.post("/submit", requireLogin, (req, res) => {
    try {
        const { userInput, originalText } = req.body;
        const username = req.session.username;
        
        let mistakes = 0;
        const maxLen = Math.max(originalText.length, userInput.length);
        for (let i = 0; i < maxLen; i++) {
            if ((userInput[i] || '') !== (originalText[i] || '')) {
                mistakes++;
            }
        }
        
        const score = Math.max(0, 100 - mistakes * 5);
        
        console.log(`User ${username} completed typing game with score: ${score}%`);
        
        res.json({ score: score });
    } catch (err) {
        console.error("Submit error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(port, ()=>{
    console.log("App listening on port " + port);
})
