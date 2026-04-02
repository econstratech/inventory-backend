const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const WorkOrderMaterialIssue = sequelize.define('work_order_material_issues', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    wo_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    rm_product_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    rm_product_variant_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    issued_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    batch_id: {
        type: DataTypes.INTEGER,
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
}, {
    tableName: 'work_order_material_issues',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = WorkOrderMaterialIssue;