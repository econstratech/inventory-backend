const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");

const RecvProduct = sequelize.define(
  "RecvProduct",
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    product_variant_id: {
      type: DataTypes.BIGINT,
      unsigned: true,
      allowNull: true,
    },
    purchase_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    warehouse_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    taxExcl: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    taxIncl: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    received: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    returned_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // batch_no: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    // manufacture_date: {
    //   type: DataTypes.DATE,
    //   allowNull: true,
    // },
    // expiry_date: {
    //   type: DataTypes.DATE,
    //   allowNull: true,
    // },  
  },
  {
    tableName: "recvproduct",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

//BillProduct.belongsTo(Bill, { foreignKey: "bill_id", as: "bill" });

module.exports = RecvProduct;