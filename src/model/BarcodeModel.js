const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const BarcodeModel = sequelize.define(
    'BarcodeModel',
    {
        company_name: {
            type: DataTypes.STRING,  // Corrected to STRING for a name field
            allowNull: false,
        },
        barcode_number: {
            type: DataTypes.STRING,  // GSTN type is likely a STRING
            allowNull: false,
        },
        item_id: {
            type: DataTypes.INTEGER,  // GSTN number should be a STRING
            allowNull: false,
        },
        comapny_name_display: {
            type: DataTypes.INTEGER,  // Address should be a STRING
            allowNull: false,
        },
        company_id: {
            type: DataTypes.INTEGER,  // Address should be a STRING
            allowNull: true,  // Allow null if it's optional
        },
        
    },
    {
        tableName: 'barcode_settings',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = BarcodeModel;
