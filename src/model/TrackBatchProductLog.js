const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const TrackBatchProductLog = sequelize.define('TrackBatchProductLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    receive_product_batch_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    sales_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    purchase_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    warehouse_id: {
        type: DataTypes.BIGINT,
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
    tableName: 'track_batch_product_log',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = TrackBatchProductLog;