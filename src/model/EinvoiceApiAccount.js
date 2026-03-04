const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const EinvoiceApiAccount = sequelize.define(
  "EinvoiceApiAccount",
  {
    gstNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: ["active", "inactive"],
      defaultValue: "active",
    },
    
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "einvoiceapiaccount",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = EinvoiceApiAccount;
