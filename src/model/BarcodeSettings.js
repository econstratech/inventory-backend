const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const BarcodeSettings = sequelize.define(
    'BarcodeSettings',
    {
        company_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        has_barcode_number: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        has_product_code: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        company_name: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        
    },
    {
        tableName: 'barcode_settings',
        timestamps: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
    }
);

module.exports = BarcodeSettings;
