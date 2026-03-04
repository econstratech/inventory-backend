const express = require("express");
// const XLSX = require("xlsx");
require('dotenv').config();
// const bcrypt = require("bcrypt");
const cors = require("cors");
// const Excel = require('exceljs');
// Route registration (all API routes mounted from router/SettingsRoute.js)
const registerRoutes = require("./router/RegisterRoute");

// const { bulkupload, uploadDir } = require("./utils/handlersbluk");
const path = require("path");
//Database connection
require('./database/db-connection.js')

// Swagger UI Setup
const { swaggerUi, swaggerSpec } = require('./documentation/swagger');
// Global API prefix for all routes – MUST start with leading slash and NOT end with one
const appPrefix = '/api';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('uploads'));
app.use(express.static('utils/uploads'));

app.use(express.static('pdf'));

// Swagger Documentation Route
app.use('/api-documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Growth ERP API Documentation',
}));
registerRoutes(app, appPrefix);




// app.get("/", async (req, res) => {
//     try {

//         // const phoneNumber = '919163220851';
//         // const message = 'this is test message';
//         // // whatsappNotification(phoneNumber,message)
//         // // MaytapiWhatsappNotification(phoneNumber,message)
//         // const info = await sendMail(
//         //     'sudipta.econstra@gmail.com', 
//         //     'Test Subject',
//         //     'Hello world?', 
//         //     '<b>Hello world?</b>' 
//         // );

//         return res.status(200).json("info");
//     } catch (err) {
//         res.status(400).json("error occure")
//     }
// })
  // ✅ Serve static React build (after APIs)
  app.use(express.static(path.join(__dirname, '../build')));

  // ✅ React SPA fallback (for routes like /dashboard)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, "../build/index.html"));
  });

app.use('/api', express.static(path.join(__dirname, 'uploads')));
require('./cron/stockAlerts.jsx'); 
app.use('/api/PO', express.static(path.join(__dirname, 'pdf')));

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server start http://localhost:${process.env.PORT}`,);
    console.log(`Swagger Documentation: http://localhost:${process.env.PORT}/api-documentation`);
})



