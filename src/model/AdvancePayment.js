const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const AdvancePayment = sequelize.define(
    'AdvancePayment',
    {
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            unique: false
        },

        purchase_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: false
        },
       
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
           
        },company_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        }

    },
    {
        tableName: 'advance_payment',
        timestamps: true,
        createdAt: "created_at",
        updatedAt: 'updated_at',
    }
);

module.exports = AdvancePayment;