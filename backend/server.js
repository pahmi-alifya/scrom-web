import express from "express";
import multer from "multer";
import unzipper from "unzipper";
import fs from "fs-extra";
import path from "path";
import { parseStringPromise } from "xml2js";

const app = express();
const PORT = 4000;

const scormDir = path.join(process.cwd(), "public/scorm");
const upload = multer({ dest: "uploads/" });

// Fungsi untuk cari launch file dari imsmanifest.xml
async function findLaunchFile(dir) {
  const manifestPath = path.join(dir, "imsmanifest.xml");
  if (await fs.pathExists(manifestPath)) {
    try {
      const xml = await fs.readFile(manifestPath, "utf-8");
      const parsed = await parseStringPromise(xml);
      const resource = parsed?.manifest?.resources?.[0]?.resource?.[0]?.$;
      if (resource?.href) {
        return resource.href;
      }
    } catch (err) {
      console.warn("Gagal parse imsmanifest.xml:", err.message);
    }
  }

  // fallback → ambil file HTML pertama di folder
  const files = await fs.readdir(dir);
  const htmlFile = files.find(
    (f) => f.toLowerCase().endsWith(".html") || f.toLowerCase().endsWith(".htm")
  );
  return htmlFile || null;
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // bersihkan folder scorm lama
    await fs.remove(scormDir);
    await fs.ensureDir(scormDir);

    const zipPath = req.file.path;
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: scormDir }))
      .promise();

    // cari file utama
    const launchFile = await findLaunchFile(scormDir);
    await fs.remove(zipPath);

    if (launchFile) {
      res.json({
        success: true,
        message: "SCORM extracted",
        path: `/scorm/${launchFile}`,
      });
    } else {
      res
        .status(400)
        .json({ success: false, error: "Tidak menemukan file HTML utama" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
