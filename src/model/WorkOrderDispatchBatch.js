const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const WorkOrderDispatchBatch = sequelize.define('work_order_dispatch_batches', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    work_order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    dispatch_log_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    batch_no: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    mfg_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    exp_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'work_order_dispatch_batches',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
});

module.exports = WorkOrderDispatchBatch;