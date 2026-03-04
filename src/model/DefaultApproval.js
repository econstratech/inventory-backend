const { Model, DataTypes } = require('sequelize');
const sequelize = require("../database/db-connection");

const DefaultApproval = sequelize.define(
    'DefaultApproval',
    {
        keyname: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: false
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

    },
    {
        tableName: 'default_approval',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    },
);
module.exports = DefaultApproval;