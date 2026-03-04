const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Customer = require("./Customer");
const CompanyManagementModel = require("./Company");


const Order = sequelize.define(
  "Order",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    custom_order_id: {
      type: DataTypes.STRING,
      allowNull: false,
    
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    shipping: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    sgst: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    cgst: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    igst: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    grand_total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM("Pending", "Paid", "Failed"),
      defaultValue: "Pending",
    },
    
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
Order.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});
Order.associate = function(models) {
    Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
    Order.belongsTo(CompanyManagementModel, { foreignKey: 'company_id', as: 'company' });
  };
module.exports = Order;
