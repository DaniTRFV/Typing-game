import express from 'express'; //backend tool
import path from 'path'; 
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3'; //SQLite database
import { open } from 'sqlite'; //SQLite database
import bcrypt from "bcrypt"; //hashing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

//Creating the database
const db = await open({
  filename: 'database.db',
  driver: sqlite3.Database
});

await db.exec(`CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  gender TEXT,
  dateOfBirth TEXT NOT NULL
)`);



app.use(express.static(path.join(__dirname, "Styles")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/" , (req, res)=>{
    res.sendFile(path.join(__dirname, "Views", "registration.html"));
});

app.post("/register", async(req,res) => {
    console.log("REGISTER ROUTE HIT");
    try {
    const user = {
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

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const result = await db.run(
  `INSERT INTO Users
   (username, password, dateOfBirth)
   VALUES (?, ?, ?)`,
  [
    user.username,
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

app.post("/login",async (req,res) =>{
  try{
    const {username, password} = req.body;
      const user = await db.get(
    "SELECT * FROM Users WHERE username =? ", [username] 
   )
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch){
      return res.status(401).send("Invalid username or password");
    }
    res.send("Login successful!");
    // later: create session or JWT here
  }

    catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

app.listen(port, ()=>{
    console.log("App listening on port " + port);
})