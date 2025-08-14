import express from "express";
import multer from "multer";
import unzipper from "unzipper";
import fs from "fs-extra";
import path from "path";
import { parseStringPromise } from "xml2js";
import { load } from "cheerio";

const app = express();
const PORT = 4000;
const scormDir = path.join(process.cwd(), "public/scorm");
const upload = multer({ dest: "uploads/" });

// Fungsi cari launch file
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
  // fallback ke HTML pertama
  let foundFile = null;
  const walk = async (folder) => {
    const files = await fs.readdir(folder);
    for (const file of files) {
      const fullPath = path.join(folder, file);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        const result = await walk(fullPath);
        if (result) return result;
      } else if (
        file.toLowerCase().endsWith(".html") ||
        file.toLowerCase().endsWith(".htm")
      ) {
        return path.relative(dir, fullPath);
      }
    }
    return null;
  };
  foundFile = await walk(dir);
  return foundFile;
}

// Mock API script
const mockApiScript = `
<script>
window.API = {
  LMSInitialize: function() { return "true"; },
  LMSFinish: function() { return "true"; },
  LMSGetValue: function(name) { return ""; },
  LMSSetValue: function(name, value) { return "true"; },
  LMSCommit: function() { return "true"; },
  LMSGetLastError: function() { return "0"; },
  LMSGetErrorString: function() { return "No error"; },
  LMSGetDiagnostic: function() { return "No diagnostic"; }
};
window.API_1484_11 = {
  Initialize: function() { return "true"; },
  Terminate: function() { return "true"; },
  GetValue: function(name) { return ""; },
  SetValue: function(name, value) { return "true"; },
  Commit: function() { return "true"; },
  GetLastError: function() { return "0"; },
  GetErrorString: function() { return "No error"; },
  GetDiagnostic: function() { return "No diagnostic"; }
};
</script>
`;

async function injectMockApiToHtml(dir) {
  const walk = async (folder) => {
    const files = await fs.readdir(folder);
    for (const file of files) {
      const fullPath = path.join(folder, file);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await walk(fullPath);
      } else if (
        file.toLowerCase().endsWith(".html") ||
        file.toLowerCase().endsWith(".htm")
      ) {
        let html = await fs.readFile(fullPath, "utf-8");
        const $ = load(html);
        $("head").prepend(mockApiScript);
        await fs.writeFile(fullPath, $.html(), "utf-8");
      }
    }
  };
  await walk(dir);
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    await fs.remove(scormDir);
    await fs.ensureDir(scormDir);

    const zipPath = req.file.path;
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: scormDir }))
      .promise();
    await fs.remove(zipPath);

    // Inject mock API
    await injectMockApiToHtml(scormDir);

    // Cari file utama
    const launchFile = await findLaunchFile(scormDir);

    if (launchFile) {
      res.json({
        success: true,
        message: "SCORM extracted & mock API injected",
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

app.use("/scorm", express.static(scormDir));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
