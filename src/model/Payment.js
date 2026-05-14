const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
// const Purchase = require("./Purchase");
// const User = require("./User");
// const CompanyManagementModel = require("./Company");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    purchase_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    journal: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    bill_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recipientBankAccount: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    memo: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    company_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
// Payment.belongsTo(Purchase, {
//   foreignKey: "purchase_id",
//   as: "purchase",
// });
// Payment.belongsTo(User, {
//   foreignKey: "user_id",
//   as: "user",
// });
// Payment.belongsTo(CompanyManagementModel, {
//   foreignKey: "company_id",
//   as: "company",
// });

// Payment.associate = function (models) {
//   Payment.belongsTo(Purchase, { foreignKey: "purchase_id", as: "purchase" });
//   Payment.belongsTo(User, { foreignKey: "user_id", as: "user" });
//   Payment.belongsTo(CompanyManagementModel, { foreignKey: "company_id", as: "company" });
// };

module.exports = Payment;
