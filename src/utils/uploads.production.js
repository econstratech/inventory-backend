const multer = require("multer");
const path = require("path");
const fs = require("fs");


const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); 
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("📂 Saving file to:", uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        console.log("📂 Saving file:", file.originalname); 
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

module.exports = upload;
