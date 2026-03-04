const { DataTypes } = require('sequelize');
const sequelize = require('../database/db-connection');

const StockTransferBatch = sequelize.define('StockTransferBatch', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    stock_transfer_log_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    stock_transfer_product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    receive_product_batch_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    tableName: 'stock_transfer_batches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
});

module.exports = StockTransferBatch;