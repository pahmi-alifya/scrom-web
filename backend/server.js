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
app.use("/courses", express.static("courses")); // serve scorm extracted

// DB setup
const db = new sqlite3.Database("./lms.db");
db.run(`
  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    courseId TEXT NOT NULL,
    data TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, courseId)
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId TEXT UNIQUE,
    name TEXT,
    path TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Multer upload config
const upload = multer({ dest: "uploads/" });

// Upload SCORM zip
app.post("/api/scorm/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const courseId = path.parse(file.originalname).name; // pakai nama file sebagai ID
  const extractPath = path.join("courses", courseId);

  if (!fs.existsSync("courses")) fs.mkdirSync("courses");

  // Kalau course sudah ada, tidak perlu extract ulang
  db.get("SELECT * FROM courses WHERE courseId = ?", [courseId], (err, row) => {
    if (row) {
      return res.json({ message: "Course already exists", course: row });
    }

    // Extract zip
    const zip = new AdmZip(file.path);
    zip.extractAllTo(extractPath, true);

    // Simpan metadata ke DB
    db.run(
      `INSERT INTO courses (courseId, name, path) VALUES (?, ?, ?)`,
      [courseId, file.originalname, extractPath],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          success: true,
          course: { courseId, name: file.originalname, path: extractPath },
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

// Get progress
app.get("/api/scorm/progress/:userId/:courseId", (req, res) => {
  const { userId, courseId } = req.params;
  db.get(
    "SELECT data FROM progress WHERE userId = ? AND courseId = ?",
    [userId, courseId],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row ? JSON.parse(row.data) : {});
    }
  );
});

// Save progress
app.post("/api/scorm/progress", (req, res) => {
  const { userId, courseId, data } = req.body;
  db.run(
    `INSERT INTO progress (userId, courseId, data)
     VALUES (?, ?, ?)
     ON CONFLICT(userId, courseId) DO UPDATE SET 
       data = excluded.data,
       updatedAt = CURRENT_TIMESTAMP`,
    [userId, courseId, JSON.stringify(data)],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(4000, () =>
  console.log("✅ Backend running on http://localhost:4000")
);
