const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const Followup = sequelize.define(
    'Followup',
    {
        purchase_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: false
        },
       
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
           
        }
    },
    {
        tableName: 'followup',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);
module.exports = Followup;