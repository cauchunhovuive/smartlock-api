const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

// ================= DATABASE =================

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "",
  database: process.env.MYSQLDATABASE || "railway",
  port: process.env.MYSQLPORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("DB connection error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

// ================= insert.php =================
// ESP32 gọi: GET /insert?uid=XX&status=Access

app.get("/insert.php", (req, res) => {
  const { uid, status } = req.query;

  if (!uid || !status) {
    return res.status(400).send("No data received");
  }

  db.query(
    "INSERT INTO logs (uid, status) VALUES (?, ?)",
    [uid, status],
    (err) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).send("ERROR");
      }
      res.send("OK");
    }
  );
});

// ================= check_open.php =================
// ESP32 poll: GET /check_open.php
// Python ghi lệnh: POST /set_open  { "name": "tuanphat" }

let pendingCommand = "NONE";

app.get("/check_open.php", (req, res) => {
  if (pendingCommand !== "NONE") {
    const cmd = pendingCommand;
    pendingCommand = "NONE"; // Xóa sau khi đọc
    return res.send(cmd);
  }
  res.send("NONE");
});

// Python Flask gọi endpoint này để mở cửa
app.post("/set_open", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Missing name");

  pendingCommand = `OPEN:${name}`;
  console.log("Command set:", pendingCommand);
  res.send("OK");
});

// ================= Xem logs =================
// GET /logs — xem toàn bộ log

app.get("/logs", (req, res) => {
  db.query(
    "SELECT * FROM logs ORDER BY time DESC LIMIT 100",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ================= Health check =================

app.get("/", (req, res) => {
  res.send("SmartLock API is running!");
});

// ================= START =================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
