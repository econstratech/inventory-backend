const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const MasterBOM = sequelize.define("MasterBOM", {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        unsigned: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        allowNull: false,
        foreignKey: {
            name: "fk_master_bom_company",
            table: "companies",
            key: "id",
        },
    },
    final_product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    final_product_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    raw_material_product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    raw_material_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    bom_no: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: "master_bom",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
});

module.exports = MasterBOM;