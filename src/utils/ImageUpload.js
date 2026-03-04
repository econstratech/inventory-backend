const multer = require("multer");
const path = require("path");
// const sharp = require('sharp');
const fs = require('fs');


const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });



const CompressImage = async (file) => {
    const { buffer, originalname } = file;
    const filename = `${Date.now()}-${originalname}`;
    const outputPath = path.join(uploadsDir, filename);

    // await sharp(buffer)
    //     .resize(800)
    //     .jpeg({ quality: 80 })
    //     .toFile(outputPath);

    return filename;
};




// Multer configuration for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save the file temporarily; it will be moved later in the UploadPo function
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});
module.exports = {
    upload,
    CompressImage,
    pdfUpload
};