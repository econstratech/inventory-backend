const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const BOM = require("./Bom");
const Product = require("./Product");
const Warehouse = require("./Warehouse");
const User = require("./User");

const Production = sequelize.define("Production", {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    production_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    product_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Product, key: "id" } 
    },
    sales_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    stage: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    quantity: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    fg_store: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }, // Finished Goods Store
    rm_store: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }, // Raw Material Store
    scrap_store: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }, // Scrap Store
    bom_number: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        references: { model: BOM, key: "bomNumber" } 
    },
    labour_charges: { 
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0 
    },
    machinery_charges: { 
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0 
    },
    electricity_charges: { 
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0 
    },
    other_charges: { 
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0 
    },
    labourChargesAA:{
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0
    },
    labourCharges_comment:{
        type: DataTypes.STRING, 
        allowNull: true, 
        defaultValue: ""
    },
    machineryChargesAA:{
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0
    },
    machineryCharges_comment:{
        type: DataTypes.STRING, 
        allowNull: true, 
        defaultValue: ""
    },
    electricityChargesAA:{
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0
    },
    electricityCharges_comment:{
        type: DataTypes.STRING, 
        allowNull: true, 
        defaultValue: ""
    },
    otherChargesAA:{
        type: DataTypes.FLOAT, 
        allowNull: false,
    },
    otherCharges_comment:{
        type: DataTypes.STRING, 
        allowNull: true, 
        defaultValue: ""
    },
    total_charges: { 
        type: DataTypes.FLOAT, 
        allowNull: false, 
        defaultValue: 0.0 
    },
    company_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    user_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    status: { 
        type: DataTypes.STRING, 
        defaultValue: "Pending" 
    },
    is_action: {
        type: DataTypes.STRING,
        defaultValue: 0
    },
    is_dispatched: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    updated_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    }
}, {
    tableName: "production",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

// ✅ Define Associations
Production.belongsTo(Product, { foreignKey: "product_id", as: "ProductDetails" });
Production.belongsTo(BOM, { foreignKey: "bom_number", targetKey: "bomNumber", as: "BOMDetails" });
Production.belongsTo(Warehouse, { foreignKey: "fg_store", targetKey: "id", as: "FGStoreDetails" });
Production.belongsTo(Warehouse, { foreignKey: "rm_store", targetKey: "id", as: "RMStoreDetails" });
Production.belongsTo(Warehouse, { foreignKey: "scrap_store", targetKey: "id", as: "ScrapStoreDetails" });
Production.belongsTo(User, { foreignKey: "user_id", as: "UserDetails" });



module.exports = Production;
