const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Production = require("./Production");
const ProductionRawMaterial = require("./ProductionRawMaterial");

const ProductionRawMaterialAlternate = sequelize.define("production_raw_material_alternate", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    production_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Production, key: "id" } 
    },
    alternative_product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity_ratio: { type: DataTypes.FLOAT, allowNull: false }
}, {
    tableName: "production_raw_material_alternate",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
ProductionRawMaterial.hasMany(ProductionRawMaterialAlternate, { foreignKey: "production_raw_material_id", as: "alternatives" });
ProductionRawMaterialAlternate.belongsTo(ProductionRawMaterial, { foreignKey: "production_raw_material_id", as: "rawMaterialDetails" });
module.exports = ProductionRawMaterialAlternate;
