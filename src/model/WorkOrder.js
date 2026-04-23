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
    production_planning_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
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
        allowNull: true,
    },
    warehouse_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    required_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    planned_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    final_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    sales_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    is_planned: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
    },
    dispatch_status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0 = Not Dispatched, 1 = Partially Dispatched, 2 = Fully Dispatched',
    },
    dispatch_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
    material_issue_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    dispatch_progress_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    production_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    production_completed_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    shift: {
        type: DataTypes.STRING,
        allowNull: true,
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