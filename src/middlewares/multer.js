const multer = require("multer");
const path = require("path");
const fs = require("fs");

const basePath = path.join(__dirname, "../../uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const getFolder = (mimetype) => {
  if (mimetype === "image/gif") return "gifs";
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype === "application/pdf") return "pdfs";
  return "others";
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = getFolder(file.mimetype);
    const finalPath = path.join(basePath, folder);
    ensureDir(finalPath);
    // Store folder name in file object for later use
    file.uploadFolder = folder;
    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    file.savedFilename = filename; // Save name for later use
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
