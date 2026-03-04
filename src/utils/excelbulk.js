const multer = require('multer');
const path = require('path');

// Store file in memory (buffer) so controllers can parse on the fly without writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedExtensions.includes(fileExtension) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error('Only .xlsx, .xls and .csv files are allowed!'));
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
