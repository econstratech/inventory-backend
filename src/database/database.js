require('dotenv').config();
const path = require('path');

module.exports = {
  dev: {
    driver: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'growthh_erp',
    multipleStatements: true
  },
  production: {
    driver: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'growthh_erp',
    multipleStatements: true
  },
  test: {
    driver: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE_TEST || 'growthh_erp_test',
    multipleStatements: true
  },
  // Global settings for db-migrate
  sqlDir: path.join(__dirname, 'migrations')
};
