/**
 * Central route registration. Mounts all API routers on the app with the given prefix.
 * @param {import('express').Application} app - Express app
 * @param {string} appPrefix - API prefix (e.g. '/api')
 */
function registerRoutes(app, appPrefix) {
  const user = require("./UserRoute");
  const product = require("./ProductRoute");
  const category = require("./ProductCategoryRoute");
  const vendor = require("./VendorRoute");
  const purchase = require("./PurchaseRoute");
  const settings = require("./SettingRoute");
  const customer = require("./CustomerRoute");
  const sales = require("./SalesRoute");
  const moduledata = require("./moduleRoutes");
  const roledata = require("./roleRoutes");
  const RolePermission = require("./RolePermissionRoute");
  const company = require("./CompanyRoute");
  const production = require("./ProductionRoute");
  const master = require("./MasterRoute");
  const bom = require("./BOM");
  const report = require("./ReportRoute");
  const inventory = require("./InventoryRoute");

  app.use(`${appPrefix}/user`, user);
  app.use(`${appPrefix}/product`, product);
  app.use(`${appPrefix}/product-category`, category);
  app.use(`${appPrefix}/vendor`, vendor);
  app.use(`${appPrefix}/purchase`, purchase);
  app.use(`${appPrefix}/customer`, customer);
  app.use(`${appPrefix}/sales`, sales);
  app.use(`${appPrefix}/inventory`, inventory);
  app.use(appPrefix, settings);
  app.use(`${appPrefix}/module`, moduledata);
  app.use(`${appPrefix}/roles`, roledata);
  app.use(appPrefix, RolePermission);
  app.use(`${appPrefix}/company`, company);
  app.use(`${appPrefix}/production`, production);
  app.use(`${appPrefix}/master`, master);
  app.use(`${appPrefix}/bom`, bom);
  app.use(`${appPrefix}/report`, report);
}

module.exports = registerRoutes;
