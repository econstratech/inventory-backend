const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const WorkOrderStep = sequelize.define('work_order_steps', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    wo_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    step_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    input_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    output_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    waste_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    yield_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
        comment: '1: Pending, 2: In-Progress, 3: Completed, 4: Skipped',
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
    tableName: 'work_order_steps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = WorkOrderStep;