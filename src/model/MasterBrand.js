const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const MasterBrand = sequelize.define('master_brands', {
    id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        primaryKey: true,
        autoIncrement: true,
    },
    company_id: {
        type: DataTypes.BIGINT,
        unsigned: true,
        notNull: true,
    },
    name: {
        type: DataTypes.STRING,
        length: 100,
        notNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        notNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        notNull: true,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        notNull: true,
        defaultValue: DataTypes.NOW,
    },
    deleted_at: {
        type: DataTypes.DATE,
    },
}, {
    tableName: 'master_brands',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
    deletedAt: "deleted_at",
});

module.exports = MasterBrand;