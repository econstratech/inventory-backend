const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
const Order = require("./Order");
const Product = require("./Product");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status:{
      type: DataTypes.INTEGER,
      allowNull: true,
    }

    
  },
  {
    tableName: "order_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
OrderItem.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

OrderItem.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

module.exports = OrderItem;
