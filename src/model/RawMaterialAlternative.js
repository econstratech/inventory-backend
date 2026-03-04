const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const RawMaterial = require("./RawMaterial");

const RawMaterialAlternative = sequelize.define("RawMaterialAlternative", {
  rawMaterialId: { type: DataTypes.INTEGER, references: { model: RawMaterial, key: "id" } },
  product_id: { type: DataTypes.INTEGER },
  product_code: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  quantity: { type: DataTypes.INTEGER },
  unit: { type: DataTypes.STRING },
  costAllocation: { type: DataTypes.FLOAT },
  comment: { type: DataTypes.TEXT },
}, {
  tableName: "raw_material_alternative",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

RawMaterial.hasMany(RawMaterialAlternative, { foreignKey: "rawMaterialId", as: "alternatives" });

module.exports = RawMaterialAlternative;
