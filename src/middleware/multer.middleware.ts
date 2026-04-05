import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    let filetypes: RegExp;
    if (file.fieldname === "image") {
      filetypes = /jpeg|jpg|png|avif|webp/;
    } else if (file.fieldname === "audio") {
      filetypes = /mp3|wav|m4a|mpeg/;
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
