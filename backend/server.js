import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import sqlite3 from "sqlite3";
import cors from "cors";
import AdmZip from "adm-zip";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/courses", express.static("courses"));

// DB setup
const db = new sqlite3.Database("./lms.db");
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )`
);
db.run(
  `CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    courseId TEXT NOT NULL,
    data TEXT,
    history TEXT,
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    UNIQUE(userId, courseId)
  )`
);
db.run(
  `CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId TEXT UNIQUE,
    name TEXT,
    path TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
);

// Auth endpoint
app.post("/api/auth/login", (req, res) => {
  const { name, email } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      // User found, return existing user data
      return res.json({ id: row.id, name: row.name, email: row.email });
    } else {
      // User not found, create a new one
      db.run(
        "INSERT INTO users (name, email) VALUES (?, ?)",
        [name, email],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          const userId = this.lastID;
          res.status(201).json({ id: userId, name, email });
        }
      );
    }
  });
});

// Multer upload config
const upload = multer({ dest: "uploads/" });

// Upload SCORM zip
app.post("/api/scorm/upload", upload.single("file"), (req, res) => {
  // ... (kode yang sama seperti sebelumnya)
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const courseId = path.parse(file.originalname).name;
  const extractPath = path.join("courses", courseId);

  if (!fs.existsSync("courses")) fs.mkdirSync("courses");

  db.get("SELECT * FROM courses WHERE courseId = ?", [courseId], (err, row) => {
    if (err) {
      fs.unlink(file.path, () => {}); // cleanup temp file
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      fs.unlink(file.path, () => {});
      return res.json({ message: "Course already exists", course: row });
    }

    const zip = new AdmZip(file.path);
    zip.extractAllTo(extractPath, true);
    fs.unlink(file.path, () => {}); // cleanup temp file

    db.run(
      "INSERT INTO courses (courseId, name, path) VALUES (?, ?, ?)",
      [courseId, file.originalname, courseId], // ubah path
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          course: { courseId, name: file.originalname, path: courseId },
        });
      }
    );
  });
});

// List courses
app.get("/api/scorm/courses", (req, res) => {
  db.all("SELECT * FROM courses", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get progress for a specific user and course
app.get("/api/scorm/progress/:userId/:courseId", (req, res) => {
  const { userId, courseId } = req.params;
  db.get(
    "SELECT data, history, startedAt, updatedAt FROM progress WHERE userId = ? AND courseId = ?",
    [userId, courseId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        res.json({
          data: JSON.parse(row.data),
          history: row.history ? JSON.parse(row.history) : [],
          startedAt: row.startedAt,
          updatedAt: row.updatedAt,
        });
      } else {
        res.status(404).json({ error: "Progress not found" });
      }
    }
  );
});

// Get all progress for a specific course
app.get("/api/scorm/course-progress/:courseId", (req, res) => {
  const { courseId } = req.params;
  const query = `
    SELECT p.*, u.name as userName, u.email as userEmail
    FROM progress p
    JOIN users u ON p.userId = u.id
    WHERE p.courseId = ?
    ORDER BY p.updatedAt DESC
  `;
  db.all(query, [courseId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Save/Update progress
app.post("/api/scorm/progress", (req, res) => {
  const { userId, courseId, data, history } = req.body;
  const dataStr = JSON.stringify(data);
  const historyStr = JSON.stringify(history);

  const query = `
    INSERT INTO progress (userId, courseId, data, history)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId, courseId) DO UPDATE SET
      data = ?,
      history = ?,
      updatedAt = CURRENT_TIMESTAMP
  `;

  db.run(
    query,
    [userId, courseId, dataStr, historyStr, dataStr, historyStr],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.get("/api/scorm/history/:userId/:courseId", (req, res) => {
  const { userId, courseId } = req.params;
  db.get(
    "SELECT history FROM progress WHERE userId = ? AND courseId = ?",
    [userId, courseId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row && row.history) {
        res.json(JSON.parse(row.history));
      } else {
        res.json([]); // Return an empty array if no history is found
      }
    }
  );
});

// Delete progress
app.delete("/api/scorm/progress/:userId/:courseId", (req, res) => {
  const { userId, courseId } = req.params;
  db.run(
    "DELETE FROM progress WHERE userId = ? AND courseId = ?",
    [userId, courseId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(4000, () =>
  console.log("✅ Backend running on http://localhost:4000")
);
