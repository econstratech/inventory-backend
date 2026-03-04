const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Production = require("./Production");

const ProductionFinishedGoods = sequelize.define("production_finished_goods", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    production_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Production, key: "id" } 
    },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit: { type: DataTypes.STRING, allowNull: false },
    costAllocation:{type:DataTypes.INTEGER, allowNull:false},
    targetProduction:{type:DataTypes.INTEGER, allowNull:true},
    completed:{type:DataTypes.INTEGER, allowNull:true},
    tested:{type:DataTypes.INTEGER, allowNull:true},
    passed:{type:DataTypes.INTEGER, allowNull:true},
    rejected:{type:DataTypes.INTEGER, allowNull:true},
    forRepair:{type:DataTypes.INTEGER, allowNull:true},
    repaired:{type:DataTypes.INTEGER, allowNull:true},
    comment:{type:DataTypes.STRING, allowNull:true},
}, {
    tableName: "production_finished_goods",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});
Production.hasMany(ProductionFinishedGoods, { foreignKey: "production_id", as: "finishedGoods" });
ProductionFinishedGoods.belongsTo(Production, { foreignKey: "production_id", as: "productionDetails" });

module.exports = ProductionFinishedGoods;
