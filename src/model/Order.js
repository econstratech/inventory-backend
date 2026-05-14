const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
// const Customer = require("./Customer");
// const CompanyManagementModel = require("./Company");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    shipping: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sgst: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    cgst: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    igst: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    grand_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM("Pending", "Paid", "Failed"),
      allowNull: false,
      defaultValue: "Pending",
    },
    payment_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    custom_order_id: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
// Order.belongsTo(Customer, {
//   foreignKey: "customer_id",
//   as: "customer",
// });
// Order.belongsTo(CompanyManagementModel, {
//   foreignKey: "company_id",
//   as: "company",
// });

// Order.associate = function (models) {
//   Order.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });
//   Order.belongsTo(CompanyManagementModel, { foreignKey: "company_id", as: "company" });
//   if (models.OrderItem) {
//     Order.hasMany(models.OrderItem, { foreignKey: "order_id", as: "items" });
//   }
// };

module.exports = Order;
