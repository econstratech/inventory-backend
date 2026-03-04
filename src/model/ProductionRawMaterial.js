const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Production = require("./Production");

const ProductionRawMaterial = sequelize.define("production_raw_material", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    
    production_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: Production, key: "id" } 
    },

    product_id: { type: DataTypes.INTEGER, allowNull: false },
    
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    usedRM: { type: DataTypes.INTEGER, allowNull: true },
    EstimatedProduction: { type: DataTypes.INTEGER, allowNull: true },
    produced: { type: DataTypes.INTEGER, allowNull: true },
    comment: { type: DataTypes.INTEGER, allowNull: true },
    
    unit: { type: DataTypes.STRING, allowNull: true },

    child_flag: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: false // ✅ False for Parent Materials
    },

    alternative_flag: { 
        type: DataTypes.BOOLEAN, 
        allowNull: false, 
        defaultValue: false // ✅ False for Normal Materials
    },

    parent_raw_material_id: { 
        type: DataTypes.INTEGER, 
        allowNull: true, // ✅ Null for Parent Materials
        references: { model: "production_raw_material", key: "id" }
    },
    store_id: { type: DataTypes.INTEGER, allowNull: true },
    addLess: { type: DataTypes.STRING, allowNull: true },
}, {
    tableName: "production_raw_material",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

// ✅ Relationships
Production.hasMany(ProductionRawMaterial, { foreignKey: "production_id", as: "rawMaterials" });
ProductionRawMaterial.belongsTo(Production, { foreignKey: "production_id", as: "productionDetails" });

// ✅ Self-Referencing for Parent-Child Relationship
ProductionRawMaterial.hasMany(ProductionRawMaterial, { 
    foreignKey: "parent_raw_material_id", 
    as: "childMaterials" 
});
ProductionRawMaterial.belongsTo(ProductionRawMaterial, { 
    foreignKey: "parent_raw_material_id", 
    as: "parentMaterial" 
});

module.exports = ProductionRawMaterial;
