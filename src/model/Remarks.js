const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const Remarks = sequelize.define(
    'Remarks',
    {
        purchase_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: false
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    },
    {
        tableName: 'remarks',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = Remarks;