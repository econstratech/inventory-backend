const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const BOM = require("./Bom");

const ScrapItem = sequelize.define("ScrapItem", {
  bomId: { type: DataTypes.INTEGER, references: { model: BOM, key: "id" } },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  product_code: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  quantity: { type: DataTypes.INTEGER },
  unit: { type: DataTypes.STRING },
  costAllocation: { type: DataTypes.FLOAT },
  comment: { type: DataTypes.TEXT },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "scrap_items",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

BOM.hasMany(ScrapItem, { foreignKey: "bomId", as: "scrapItems" });
ScrapItem.belongsTo(BOM, { foreignKey: "bomId", as: "bom" });

module.exports = ScrapItem;
