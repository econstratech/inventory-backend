const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const SalesProductReceived = sequelize.define('SalesProductReceived', {
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    sales_product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    sales_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    received_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    rejected_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    unit_price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
    },
    tax: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
    },
    taxExcl: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
    },
    taxIncl: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
    },
    received_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'sales_product_received',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = SalesProductReceived;