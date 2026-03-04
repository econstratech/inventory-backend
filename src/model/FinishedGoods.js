const { DataTypes, Model } = require("sequelize");
const sequelize = require("../database/db-connection");
const BOM = require("./Bom");
const Product = require("./Product");

const FinishedGoods = sequelize.define("FinishedGoods", {
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
  tableName: "finishedgoods",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

BOM.hasMany(FinishedGoods, { foreignKey: "bomId", as: "finishedGoods" });

FinishedGoods.belongsTo(BOM, { foreignKey: "bomId", as: "bom" });



//FinishedGoods.belongsTo(Product, { foreignKey: "product_id", as: "ProductsItem" });

module.exports = FinishedGoods;
