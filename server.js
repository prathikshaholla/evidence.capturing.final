import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serves index.html, shake.js, sos.js

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

const sosFile = path.join(__dirname, "sos_log.json");
const shakeIntensityFile = path.join(__dirname, "shake_intensity_log.json");

// ✅ Helper function to save SOS logs
function saveData(filename, data) {
  const existing = fs.existsSync(filename)
    ? JSON.parse(fs.readFileSync(filename, "utf8"))
    : [];
  existing.push(data);
  fs.writeFileSync(filename, JSON.stringify(existing, null, 2));
}

// ✅ Helper function to save shake intensity data
function saveShakeIntensity(filename, data) {
  const existing = fs.existsSync(filename)
    ? JSON.parse(fs.readFileSync(filename, "utf8"))
    : [];
  existing.push(data);
  // Keep only last 1000 entries to prevent file from getting too large
  if (existing.length > 1000) {
    existing.shift();
  }
  fs.writeFileSync(filename, JSON.stringify(existing, null, 2));
}

// ✅ Endpoint to receive shake intensity data
app.post("/shake-intensity", (req, res) => {
  const { intensity, acceleration, timestamp } = req.body;

  const shakeData = {
    intensity: intensity || "0",
    acceleration: acceleration || { x: "0", y: "0", z: "0" },
    timestamp: timestamp || new Date().toISOString(),
  };

  saveShakeIntensity(shakeIntensityFile, shakeData);

  res.json({ status: "Shake intensity logged successfully" });
});

// ✅ Endpoint to receive SOS alerts
app.post("/sos", (req, res) => {
  const { user, time, intensity, location } = req.body;

  const sosDetails = {
    user: user || "Anonymous",
    time: time || new Date().toISOString(),
    intensity: intensity || "N/A",
    location: location || "Unknown",
  };

  saveData(sosFile, sosDetails);
  console.log("🚨 SOS Logged:", sosDetails);

  res.json({ status: "SOS data logged successfully" });
});

// ✅ Endpoint to download all SOS logs
app.get("/download-sos", (req, res) => {
  if (!fs.existsSync(sosFile)) {
    return res.status(404).json({ error: "No SOS logs found" });
  }
  res.download(sosFile, "sos_log.json");
});

// ✅ Endpoint to download shake intensity logs
app.get("/download-shake-intensity", (req, res) => {
  if (!fs.existsSync(shakeIntensityFile)) {
    return res.status(404).json({ error: "No shake intensity logs found" });
  }
  res.download(shakeIntensityFile, "shake_intensity_log.json");
});

app.post("/upload", upload.single("media"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ status: "success", filename: req.file.filename, path: req.file.path });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
