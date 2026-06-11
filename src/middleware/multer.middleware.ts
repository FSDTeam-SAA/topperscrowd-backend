import multer from "multer";
import path from "path";
import fs from "fs";

const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 1024; // 1 GB
const UPLOAD_DIR = path.join(__dirname, "../../uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (_req, _file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      _file.fieldname + "-" + uniqueSuffix + path.extname(_file.originalname)
    );
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    let filetypes: RegExp;
    if (file.fieldname === "image" || file.fieldname === "coverImage") {
      filetypes = /jpeg|jpg|png|avif|webp/;
    } else if (file.fieldname === "audio") {
      filetypes = /mp3|wav|m4a|mpeg|mp4|aac|ogg/;
    } else if (file.fieldname === "file") {
      filetypes = /pdf|epub/;
    } else {
      return cb(new Error("Unknown field name!"));
    }

    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error(`Invalid file type for field ${file.fieldname}!`));
  },
});
