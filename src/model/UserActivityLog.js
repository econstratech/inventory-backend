const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const UserActivityLog = sequelize.define('UserActivityLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    module: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING(60),
        allowNull: false,
    },
    entity_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    entity_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    entity_reference: {
        type: DataTypes.STRING(150),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    ip_address: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'user_activity_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

module.exports = UserActivityLog;
