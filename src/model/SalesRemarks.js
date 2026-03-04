const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const SalesRemarks = sequelize.define(
    'SalesRemarks',
    {
        sales_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: false
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },

    },
    {
        tableName: 'sales_remarks',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = SalesRemarks;