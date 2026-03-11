const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const ServiceAuditLog = sequelize.define('ServiceAuditLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    service_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    service_method: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    service_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    token_hash: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    service_request: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    service_response: {
        type: DataTypes.JSON,
        allowNull: true,
    },
}, {
    tableName: 'service_audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = ServiceAuditLog;