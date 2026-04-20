const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const { required } = require("joi");

const ProductionPlanning = sequelize.define('production_planning', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    wo_number: {
        type: DataTypes.STRING,
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
    required_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    planned_qty: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    shift: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    planned_start_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    planned_end_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    process_step: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    responsible_staff: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'production_planning',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
});

module.exports = ProductionPlanning;