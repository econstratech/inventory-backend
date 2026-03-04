const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Store = require("./Warehouse");
const User = require("./User");
const FinishedGoods = require("./FinishedGoods");

const BOM = sequelize.define("BOM", {
  bomNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  documentName: { type: DataTypes.STRING },
  FGStore: { type: DataTypes.STRING },
  RMStore: { type: DataTypes.STRING },
  ScrapRejectStore: { type: DataTypes.STRING }, // ✅ Added field
  attachments: { type: DataTypes.JSON },
  description: { type: DataTypes.TEXT },
  comment: { type: DataTypes.TEXT },
  labour_charges_amount: { type: DataTypes.FLOAT },
  labour_charges_comment: { type: DataTypes.TEXT },
  machinery_charges_amount: { type: DataTypes.FLOAT },
  machinery_charges_comment: { type: DataTypes.TEXT },
  electricity_charges_amount: { type: DataTypes.FLOAT },
  electricity_charges_comment: { type: DataTypes.TEXT },
  other_charges_amount: { type: DataTypes.FLOAT },
  other_charges_comment: { type: DataTypes.TEXT },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  modif_user_id: { type: DataTypes.INTEGER, allowNull: true },
  is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "bom_production",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

BOM.belongsTo(Store, { foreignKey: "FGStore", as: "FGStoreDetails" });
BOM.belongsTo(Store, { foreignKey: "RMStore", as: "RMStoreDetails" });
BOM.belongsTo(User, { foreignKey: "user_id", as: "UserDetails" });
BOM.belongsTo(User, { foreignKey: "modif_user_id", as: "UserDetailsM" });
//BOM.hasMany(FinishedGoods, { foreignKey: "bomId", as: "finishedGoods" });

module.exports = BOM;
