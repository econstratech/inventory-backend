const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const StockTransferLog = sequelize.define('StockTransferLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    reference_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    from_warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    to_warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    sales_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    purchase_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    transfer_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'stock_transfer_log',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = StockTransferLog;