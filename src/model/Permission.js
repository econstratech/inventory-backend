const { DataTypes } = require("sequelize");
const sequelize = require("../database/db-connection");


const Permission = sequelize.define("Permission", {
   id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  guard_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "web",
  },
  module_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  }
}, {
  tableName: "permissions_data",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: 'updated_at',
});


module.exports = Permission;
