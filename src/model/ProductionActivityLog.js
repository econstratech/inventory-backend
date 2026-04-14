const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ProductionActivityLog = sequelize.define('production_activity_logs', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    wo_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    activity: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    activity_data: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    created_by: {
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
    tableName: 'production_activity_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = ProductionActivityLog;