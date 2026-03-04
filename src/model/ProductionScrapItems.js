const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Production = require("./Production");

const ProductionScrapItems = sequelize.define("production_scrap_items", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    production_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Production, key: "id" } 
    },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    scrap_qty: { type: DataTypes.INTEGER, allowNull: false },
    scrap_unit: { type: DataTypes.STRING, allowNull: false },
    estimatedquantity: { type: DataTypes.INTEGER, allowNull: false },
    actualquantity	: { type: DataTypes.INTEGER, allowNull: false },
    costAllocation:{type:DataTypes.INTEGER, allowNull:false},
    comment:{type:DataTypes.STRING, allowNull:false}
}, {
    tableName: "production_scrap_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

module.exports = ProductionScrapItems;
