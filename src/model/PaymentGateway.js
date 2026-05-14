const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
// const CompanyManagementModel = require("./Company");

const PaymentGateway = sequelize.define(
  "PaymentGateway",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    gatewayname: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    keyid: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    keysecret: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    company_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "payment_gateways",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
// PaymentGateway.belongsTo(CompanyManagementModel, {
//   foreignKey: "company_id",
//   as: "company",
// });

// PaymentGateway.associate = function (models) {
//   PaymentGateway.belongsTo(CompanyManagementModel, { foreignKey: "company_id", as: "company" });
// };

module.exports = PaymentGateway;
