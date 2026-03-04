const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const BOM = require("./Bom");

const RawMaterial = sequelize.define(
  "RawMaterial",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Ensure id is explicitly defined
    bomId: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      references: { model: BOM, key: "id" } 
    },
    product_id: { type: DataTypes.INTEGER, allowNull: false }, 
    product_code: { type: DataTypes.STRING },
    name: { type: DataTypes.STRING },
    category: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER },
    unit: { type: DataTypes.STRING },
    comment: { type: DataTypes.TEXT },
    parentRawMaterialId: { 
      type: DataTypes.INTEGER, 
      allowNull: true, 
      references: { model: "RawMaterial", key: "id" } // ✅ Corrected self-referencing association
    },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "rawmaterial", // ✅ Ensure consistent plural table name
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);



// 🔹 A BOM has multiple Raw Materials
BOM.hasMany(RawMaterial, { foreignKey: "bomId", as: "rawMaterials" });
RawMaterial.belongsTo(BOM, { foreignKey: "bomId", as: "bom" });

// 🔹 Self-Referencing Relationship: A Raw Material can have Child Raw Materials
RawMaterial.hasMany(RawMaterial, { 
  foreignKey: "parentRawMaterialId", 
  as: "childMaterials" 
});
RawMaterial.belongsTo(RawMaterial, { 
  foreignKey: "parentRawMaterialId", 
  as: "parentRawMaterial" 
});


//RawMaterial.hasMany(RawMaterialAlternative, { foreignKey: "rawMaterialId", as: "alternatives" });
//RawMaterialAlternative.belongsTo(RawMaterial, { foreignKey: "rawMaterialId", as: "rawMaterial" });

module.exports = RawMaterial;