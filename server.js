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

// ================= DOOR STATE =================
// pendingCommand  → ESP32 đọc 1 lần rồi xóa
// doorState       → UI mobile poll liên tục, không xóa

const DOOR_AUTO_CLOSE_MS = 5000; // sync với ESP32

let pendingCommand = "NONE";

let doorState = {
  open: false,
  openedAt: null,
  triggeredBy: null,
};

function openDoorState(triggeredBy) {
  doorState = { open: true, openedAt: Date.now(), triggeredBy };
}

function checkAutoClose() {
  if (doorState.open && Date.now() - doorState.openedAt > DOOR_AUTO_CLOSE_MS) {
    doorState = { open: false, openedAt: null, triggeredBy: null };
  }
}

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
// ESP32 poll: GET /check_open.php — đọc lệnh 1 lần rồi xóa

app.get("/check_open.php", (req, res) => {
  if (pendingCommand !== "NONE") {
    const cmd = pendingCommand;
    pendingCommand = "NONE";
    return res.send(cmd);
  }
  res.send("NONE");
});

// ================= set_open =================
// Python Flask gọi: POST /set_open { "name": "tuanphat" }

app.post("/set_open", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Missing name");

  pendingCommand = `OPEN:${name}`;
  openDoorState(name);
  console.log("Command set:", pendingCommand);
  res.send("OK");
});

// ================= Mở cửa từ xa (Mobile) =================
// POST /open_door — app mobile bấm mở

app.post("/open_door", (req, res) => {
  pendingCommand = "OPEN:remote";
  openDoorState("remote");
  console.log("Remote open command set");
  res.json({ success: true, message: "Door opening..." });
});

// ================= Trạng thái cửa (Mobile) =================
// GET /api/door-status — mobile poll để hiển thị UI
// Khác với check_open.php: KHÔNG xóa flag, tự reset sau 5 giây

app.get("/api/door-status", (req, res) => {
  checkAutoClose();
  res.json(doorState);
});

// ================= Logs =================

app.get("/logs", (req, res) => {
  db.query(
    "SELECT * FROM logs ORDER BY time DESC LIMIT 100",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

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

app.get("/api/uids", (req, res) => {
  db.query(
    "SELECT id, uid, label, created_at AS createdAt FROM uid_list ORDER BY id DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

app.post("/api/uids", (req, res) => {
  const { uid, label } = req.body;
  if (!uid || !label)
    return res.status(400).json({ error: "Missing uid or label" });

  const cleanUID = uid.trim().toUpperCase();

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

app.delete("/api/uids/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  db.query("DELETE FROM uid_list WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// GET /api/uids/plain — ESP32 fetch danh sách UID thay vì hardcode
app.get("/api/uids/plain", (req, res) => {
  db.query("SELECT uid FROM uid_list", (err, results) => {
    if (err) return res.status(500).send("ERROR");
    const plain = results.map((r) => r.uid).join("\n");
    res.type("text/plain").send(plain);
  });
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