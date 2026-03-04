const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const Warehouse = sequelize.define(
    'Warehouse',
    {
        name: {
            type: DataTypes.STRING,  // Corrected to STRING for a name field
            allowNull: false,
        },
        location : {
            type: DataTypes.STRING,
            allowNull: true,
        },
        gstn_type: {
            type: DataTypes.STRING,  // GSTN type is likely a STRING
            allowNull: true,
        },
        gstn_no: {
            type: DataTypes.STRING,  // GSTN number should be a STRING
            allowNull: true,
        },
        address1: {
            type: DataTypes.STRING,  // Address should be a STRING
            allowNull: true,
        },
        address2: {
            type: DataTypes.STRING,  // Address should be a STRING
            allowNull: true,  // Allow null if it's optional
        },
        city: {
            type: DataTypes.STRING,  // City should be a STRING
            allowNull: false,
        },
        country: {
            type: DataTypes.STRING,  // Country should be a STRING
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING,  // State should be a STRING
            allowNull: true,
        },
        pin: {
            type: DataTypes.STRING,  // PIN should be a STRING
            allowNull: false,
        },
        is_default: {
            type: DataTypes.BOOLEAN,  // is_default should be a BOOLEAN
            defaultValue: true,
        },
        store_type: {
            type: DataTypes.STRING,  // is_default should be a BOOLEAN
            defaultValue: null,
        },
        company_id: {
            type: DataTypes.INTEGER,  // Company ID should be an INTEGER
            allowNull: false,
        },
        is_fg_store: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        is_rm_store: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
    },
    {
        tableName: 'warehouses',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = Warehouse;
