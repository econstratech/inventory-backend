const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const Bill = sequelize.define(
  "Bill",
  {
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bill_number:{
        type: DataTypes.STRING,
        allowNull: true,
      },
    purchase_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bill_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accounting_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bill_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    placeofsupply: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buyer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentreference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    untaxed_amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    sgst: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    cgst: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    advancePayment: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }, 
     status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "bill",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);


module.exports = Bill;
