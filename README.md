# Growthh ERP — Backend API

This repository contains the backend API for Growthh ERP. It is a Node.js / Express application using Sequelize (MySQL) and various utilities for PDF generation, file uploads (local + AWS S3), product/stock management, purchase orders, and production/BOM endpoints.

## Key features
- REST API for customers, vendors, products, purchases, sales, production, BOM and more.
- File uploads: local and AWS S3 support via [`UploadFileToAWS`](src/utils/awsUpload.jsx) and helpers in [`src/utils/ImageUpload.js`](src/utils/ImageUpload.js).
- Stock tracking and adjustments: implemented in [`src/controller/ProductController.js`](src/controller/ProductController.js) (`UpdateStockAndTrack`, `UpdateStockOnly`).
- Purchase order PDF generation: [`generatePDF`](src/controller/PurchaseController.js) generates and writes PDFs using templates.
- Production/BOM routes and file uploads: see [`src/router/ProductionRoute.js`](src/router/ProductionRoute.js).
- Sequelize models and associations (sales/purchases/products): inspected in [`src/model/Sales.js`](src/model/Sales.js).
- Bulk file upload helpers and CSV/XLSX handling: [`src/utils/handlersbluk.js`](src/utils/handlersbluk.js).

## Important files
- Project entry: [`src/index.js`](src/index.js)  
- Dependency manifest: [`package.json`](package.json)  
- Docker image: [`Dockerfile`](Dockerfile)  
- AWS upload helper: [`src/utils/awsUpload.jsx`](src/utils/awsUpload.jsx) — exports [`UploadFileToAWS`](src/utils/awsUpload.jsx)  
- Image/PDF upload helpers: [`src/utils/ImageUpload.js`](src/utils/ImageUpload.js) — exports [`upload`](src/utils/ImageUpload.js), [`CompressImage`](src/utils/ImageUpload.js), [`pdfUpload`](src/utils/ImageUpload.js)  
- Product controller (stock & tracking): [`src/controller/ProductController.js`](src/controller/ProductController.js) — see `UpdateStockAndTrack` and `UpdateStockOnly`  
- Purchase controller (PDF generation): [`src/controller/PurchaseController.js`](src/controller/PurchaseController.js) — see [`generatePDF`](src/controller/PurchaseController.js)  
- Customer & Vendor controllers (S3 uploads): [`src/controller/CustomersController.js`](src/controller/CustomersController.js), [`src/controller/VendorController.js`](src/controller/VendorController.js)  
- Production routes: [`src/router/ProductionRoute.js`](src/router/ProductionRoute.js)  
- Bulk-upload helper: [`src/utils/handlersbluk.js`](src/utils/handlersbluk.js)  
- Git ignore includes uploads: see [`.gitignore`](.gitignore)

## Local development / quick start

Prerequisites
- Node.js (v19+ recommended)
- MySQL server
- Optional: Docker for containerized run

## Setup (Windows)

1. Open a terminal (PowerShell or cmd) and install dependencies:
```powershell
cd d:\growthh-projects\growth-erp\api
npm install
```

2. Create `.env` at project root. Use the example below and adjust values:

.env.example:
```env
# Server
PORT=5000
NODE_ENV=development

# Database (MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=growthh_erp

# Session / Auth
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=your-bucket
AWS_REGION=ap-south-1

# Uploads
UPLOAD_DIR=uploads
```

Note: Inspect `src/utils/awsUpload.jsx`, `src/index.js` and controllers to match exact env var names used in code and adjust `.env`.

3. Prepare the database
- Create the database in MySQL:
```sql
CREATE DATABASE growthh_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
- The app uses Sequelize models in `src/model`. If the project does not include migrations, enable sync during development by adding or confirming sequelize.sync({ alter: true }) in `src/index.js`. Example (only for dev):

```js
// in src/index.js (dev only)
// ...existing code...
await sequelize.sync({ alter: true });
// ...existing code...
```

4. Ensure required directories exist:
```powershell
mkdir uploads
mkdir src/pdf
```

5. Start the server
- Development (auto-restart with nodemon):
```powershell
npm run dev
```
- Production:
```powershell
npm start
```
Server listens on PORT from `.env` (default 5000).

## Useful npm scripts
- npm run dev — nodemon src/index.js (development)
- npm start — node src/index.js (production)
- You can add a db sync script if desired:
```json
"scripts": {
  "db:sync": "node scripts/sync-db.js"
}
```

## Docker (optional)
Build and run (Windows PowerShell):
```powershell
docker build -t growthh-erp-api .
docker run --env-file .env -p 5000:5000 --name growthh-erp-api growthh-erp-api
```
If using MySQL container, use Docker Compose to link network and environment variables.

## AWS S3 uploads
- AWS helper lives in `src/utils/awsUpload.jsx`. Ensure AWS keys and bucket name in `.env` match what the code expects.
- Confirm IAM user has PutObject permission for the bucket.

## File uploads & PDF generation
- Local uploads: `src/utils/ImageUpload.js` (multer helpers).
- Bulk/CSV/XLSX: `src/utils/handlersbluk.js`.
- PDFs: templates in `src/templates` and output may be written to `src/pdf` (ensure writable).

## Troubleshooting
- DB connection refused: verify host/port/user/password and MySQL is running.
- Missing env vars: inspect controllers and utils for expected variable names.
- S3 access errors: check credentials, region, bucket name and IAM permissions.
- Native module install failures (puppeteer): follow module-specific install notes for Windows (install build tools or use prebuilt binaries).

## Recommended next steps
- Add `.env.example` to repo.
- Add a safe dev-only DB sync script or Sequelize migrations.
- Create a Postman collection or OpenAPI spec for main endpoints.
- Add basic unit tests and CI for key controllers.

If you want, I can:
- Add a `.env.example` file to the repo.
- Add a small dev-only sequelize sync script and npm script.
- Generate a short API reference for main endpoints (customers, vendors, products, purchases).
```// filepath: d:\growthh-projects\growth-erp\api\README.md
...existing code...
# Growthh ERP — Backend API

Backend API for Growthh ERP. Built with Node.js, Express and Sequelize (MySQL). Provides REST endpoints for customers, vendors, products, purchases, sales, production/BOM, file uploads (local & AWS S3), PDF generation, and stock management.

## Contents
- src/index.js — app entry
- src/model/* — Sequelize models
- src/controller/* — route handlers
- src/router/* — route definitions
- src/utils/* — helpers (AWS S3, uploads, CSV/XLSX, PDF)
- src/templates/ — PDF/HTML templates (if present)
- Dockerfile — container build

## Prerequisites
- Node.js 18+ and npm
- MySQL server
- Optional: Docker / Docker Compose
- Optional: AWS account + S3 bucket for cloud uploads

## Setup (Windows)

1. Open a terminal (PowerShell or cmd) and install dependencies:
```powershell
cd d:\growthh-projects\growth-erp\api
npm install
```

2. Create `.env` at project root. Use the example below and adjust values:

.env.example:
```env
# Server
PORT=5000
NODE_ENV=development

# Database (MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=growthh_erp

# Session / Auth
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET_NAME=your-bucket
AWS_REGION=ap-south-1

# Uploads
UPLOAD_DIR=uploads
```

Note: Inspect `src/utils/awsUpload.jsx`, `src/index.js` and controllers to match exact env var names used in code and adjust `.env`.

3. Prepare the database
- Create the database in MySQL:
```sql
CREATE DATABASE growthh_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
- The app uses Sequelize models in `src/model`. If the project does not include migrations, enable sync during development by adding or confirming sequelize.sync({ alter: true }) in `src/index.js`. Example (only for dev):

```js
// in src/index.js (dev only)
// ...existing code...
await sequelize.sync({ alter: true });
// ...existing code...
```

4. Ensure required directories exist:
```powershell
mkdir uploads
mkdir src/pdf
```

5. Start the server
- Development (auto-restart with nodemon):
```powershell
npm run dev
```
- Production:
```powershell
npm start
```
Server listens on PORT from `.env` (default 5000).

## Useful npm scripts
- npm run dev — nodemon src/index.js (development)
- npm start — node src/index.js (production)
- You can add a db sync script if desired:
```json
"scripts": {
  "db:sync": "node scripts/sync-db.js"
}
```

## Docker (optional)
Build and run (Windows PowerShell):
```powershell
docker build -t growthh-erp-api .
docker run --env-file .env -p 5000:5000 --name growthh-erp-api growthh-erp-api
```
If using MySQL container, use Docker Compose to link network and environment variables.

## AWS S3 uploads
- AWS helper lives in `src/utils/awsUpload.jsx`. Ensure AWS keys and bucket name in `.env` match what the code expects.
- Confirm IAM user has PutObject permission for the bucket.

## File uploads & PDF generation
- Local uploads: `src/utils/ImageUpload.js` (multer helpers).
- Bulk/CSV/XLSX: `src/utils/handlersbluk.js`.
- PDFs: templates in `src/templates` and output may be written to `src/pdf` (ensure writable).