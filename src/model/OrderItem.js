const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");
// const Order = require("./Order");
// const Product = require("./Product");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    product_variant_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "order_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
// OrderItem.belongsTo(Order, {
//   foreignKey: "order_id",
//   as: "order",
// });

// OrderItem.belongsTo(Product, {
//   foreignKey: "product_id",
//   as: "product",
// });

// OrderItem.associate = function (models) {
//   OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });
//   OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });
// };

module.exports = OrderItem;
