const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");


const Payment = sequelize.define('Payment', {
    journal: {
        type: DataTypes.STRING,
        allowNull: true
    },
    purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    bill_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    recipientBankAccount: {
        type: DataTypes.STRING,
        allowNull: true
    },
    memo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: 'payments',
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

module.exports = Payment;
