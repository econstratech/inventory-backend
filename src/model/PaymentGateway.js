const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const PaymentGateway = sequelize.define(
  "PaymentGateway",
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gatewayname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      keyid: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      keysecret: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
        tableName: 'payment_gateways',
        timestamps: true,
        underscored: true,
      });


module.exports = PaymentGateway;

