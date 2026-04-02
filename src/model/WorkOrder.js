const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const WorkOrder = sequelize.define('work_orders', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    wo_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    final_product_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    customer_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    planned_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    production_step_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
        comment: '1: Pending, 2: In Progress, 3: Material Issued, 4: Completed, 5: Cancelled',
    },
    material_issued_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    material_issued_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    progress_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    tableName: 'work_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = WorkOrder;