const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const WorkOrderDispatchLog = sequelize.define('work_order_dispatch_logs', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    work_order_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    dispatched_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    dispatch_note: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    dispatched_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    dispacthed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'work_order_dispatch_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
});

module.exports = WorkOrderDispatchLog;