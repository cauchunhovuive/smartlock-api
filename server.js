const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

// ================= CORS =================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

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

    // Tự tạo bảng uid_list nếu chưa có
    db.query(`
      CREATE TABLE IF NOT EXISTS uid_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(50) UNIQUE NOT NULL,
        label VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error("Create uid_list error:", err);
      else console.log("uid_list table ready");
    });
  }
});

// ================= insert.php =================
// ESP32 gọi: GET /insert.php?uid=XX&status=Access

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

// ================= Mở cửa từ xa (Mobile) =================

app.post("/open_door", (req, res) => {
  pendingCommand = "OPEN:remote";
  console.log("Remote open command set");
  res.json({ success: true, message: "Door opening..." });
});

// ================= Lấy logs (Mobile) =================

app.get("/api/logs", (req, res) => {
  db.query(
    "SELECT * FROM logs ORDER BY time DESC LIMIT 50",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// ================= Quản lý UID (Mobile) =================

// GET /api/uids — danh sách thẻ RFID
app.get("/api/uids", (req, res) => {
  db.query(
    "SELECT id, uid, label, created_at AS createdAt FROM uid_list ORDER BY id DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

// POST /api/uids — thêm thẻ mới { uid, label }
app.post("/api/uids", (req, res) => {
  const { uid, label } = req.body;
  if (!uid || !label)
    return res.status(400).json({ error: "Missing uid or label" });

  const cleanUID = uid.trim().toUpperCase(); // uppercase giống ESP32

  db.query(
    "INSERT INTO uid_list (uid, label) VALUES (?, ?)",
    [cleanUID, label.trim()],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(409).json({ error: "UID đã tồn tại" });
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});

// DELETE /api/uids/:id — xóa thẻ
app.delete("/api/uids/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  db.query("DELETE FROM uid_list WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET /api/uids/plain — ESP32 fetch danh sách UID thay vì hardcode
// Trả về plain text: "UID1\nUID2\n..."
app.get("/api/uids/plain", (req, res) => {
  db.query("SELECT uid FROM uid_list", (err, results) => {
    if (err) return res.status(500).send("ERROR");
    const plain = results.map((r) => r.uid).join("\n");
    res.type("text/plain").send(plain);
  });
});

// ================= START =================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});